const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getAccessToken(credentials: any): Promise<string> {
  // Base64URL helpers for JWT
  const base64urlEncode = (str: string) => {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/,'');
  };
  const base64urlFromArrayBuffer = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/,'');
  };

  const now = Math.floor(Date.now() / 1000);
  const header = base64urlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64urlEncode(JSON.stringify({
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }));
  const unsigned = `${header}.${payload}`;

  const pem = credentials.private_key as string;
  const base64 = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\n/g, '');
  const keyData = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(unsigned));
  const jwt = `${unsigned}.${base64urlFromArrayBuffer(sig)}`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error('Token request failed:', errorText);
    throw new Error(`Token request failed: ${tokenResponse.statusText}`);
  }

  const { access_token } = await tokenResponse.json();
  return access_token;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Updating lead in Google Sheets...');
    
    const { tripId, updates } = await req.json();
    
    if (!tripId || !updates) {
      throw new Error('Missing tripId or updates');
    }

    console.log(`Updating lead ${tripId} with:`, updates);

    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    const sheetUrl = Deno.env.get('GOOGLE_SHEET_URL');
    
    if (!serviceAccountJson || !sheetUrl) {
      throw new Error('Missing Google Sheets credentials');
    }

    const credentials = JSON.parse(serviceAccountJson);
    
    // Extract sheet ID from URL
    const sheetIdMatch = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!sheetIdMatch) {
      throw new Error('Invalid Google Sheet URL format');
    }
    const spreadsheetId = sheetIdMatch[1];

    // Get OAuth token
    const access_token = await getAccessToken(credentials);

    // First, find the row number by fetching all leads
    const worksheetName = 'MASTER DATA';
    const sheetResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(worksheetName)}!A2:A10000`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    if (!sheetResponse.ok) {
      throw new Error(`Sheet fetch failed: ${sheetResponse.statusText}`);
    }

    const sheetData = await sheetResponse.json();
    const tripIds = sheetData.values || [];
    const rowIndex = tripIds.findIndex((row: any[]) => row[0] === tripId);

    if (rowIndex === -1) {
      throw new Error('Lead not found');
    }

    const rowNumber = rowIndex + 2; // +2 because sheets are 1-indexed and row 1 is header

    // Column mappings: A=1, B=2, C=3, D=4, E=5, G=7, H=8, K=11, L=12, M=13, N=14, O=15, P=16, Q=17
    const columnMap: Record<string, string> = {
      consultant: 'C',
      status: 'D',
      travelDate: 'G',
      travelState: 'H',
      remarks: 'K',
      nights: 'L',
      pax: 'M',
      hotelCategory: 'N',
      mealPlan: 'O',
      phone: 'P',
      email: 'Q',
    };

    // Update each field individually
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && columnMap[key]) {
        const column = columnMap[key];
        const range = `${worksheetName}!${column}${rowNumber}`;
        
        console.log(`Updating ${range} with value:`, value);

        const updateResponse = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              values: [[value]],
            }),
          }
        );

        if (!updateResponse.ok) {
          console.error(`Failed to update ${column}:`, await updateResponse.text());
        }
      }
    }

    console.log('Lead updated successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Lead updated successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error updating lead:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
