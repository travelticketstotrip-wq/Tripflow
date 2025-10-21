const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Lead {
  tripId: string;
  date: string;
  consultant: string;
  status: string;
  travellerName: string;
  travelDate: string;
  travelState: string;
  remarks: string;
  nights: string;
  pax: string;
  hotelCategory: string;
  mealPlan: string;
  phone: string;
  email: string;
  priority?: string;
}

async function getAccessToken(credentials: any): Promise<string> {
  const jwtHeader = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const jwtClaimSet = btoa(JSON.stringify({
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }));

  const privateKey = credentials.private_key.replace(/-----BEGIN PRIVATE KEY-----|\n|-----END PRIVATE KEY-----/g, '');
  const jwtSignature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    await crypto.subtle.importKey(
      'pkcs8',
      Uint8Array.from(atob(privateKey), c => c.charCodeAt(0)),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    ),
    new TextEncoder().encode(`${jwtHeader}.${jwtClaimSet}`)
  );

  const jwt = `${jwtHeader}.${jwtClaimSet}.${btoa(String.fromCharCode(...new Uint8Array(jwtSignature)))}`;

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
    console.log('Fetching leads from Google Sheets...');
    
    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    const sheetUrl = Deno.env.get('GOOGLE_SHEETS_URL');
    
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

    // Fetch leads from MASTER DATA sheet
    const worksheetName = 'MASTER DATA';
    const sheetResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(worksheetName)}!A2:Z10000`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    if (!sheetResponse.ok) {
      throw new Error(`Sheet fetch failed: ${sheetResponse.statusText}`);
    }

    const sheetData = await sheetResponse.json();
    const rows = sheetData.values || [];

    console.log(`Found ${rows.length} lead rows`);

    // Parse leads with column mappings (A=0, B=1, C=2, etc.)
    const leads: Lead[] = rows
      .map((row: any[]) => ({
        tripId: row[0] || '',
        date: row[1] || '',
        consultant: row[2] || '',
        status: row[3] || '',
        travellerName: row[4] || '',
        travelDate: row[6] || '',
        travelState: row[7] || '',
        remarks: row[10] || '',
        nights: row[11] || '',
        pax: row[12] || '',
        hotelCategory: row[13] || '',
        mealPlan: row[14] || '',
        phone: row[15] || '',
        email: row[16] || '',
        priority: row[17] || '',
      }))
      .filter((lead: Lead) => lead.tripId); // Only include rows with a trip ID

    // Sort by date descending (latest first)
    leads.sort((a, b) => {
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      return dateB - dateA;
    });

    console.log(`Returning ${leads.length} leads`);

    return new Response(
      JSON.stringify({ leads }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error fetching leads:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
