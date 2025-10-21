const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface User {
  name: string;
  email: string;
  phone: string;
  role: string;
  password: string;
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
    console.log('Fetching users from Google Sheets...');
    
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

    // Fetch users from BACKEND SHEET
    const worksheetName = 'BACKEND SHEET';
    const sheetResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(worksheetName)}!A2:Z1000`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    if (!sheetResponse.ok) {
      throw new Error(`Sheet fetch failed: ${sheetResponse.statusText}`);
    }

    const sheetData = await sheetResponse.json();
    const rows = sheetData.values || [];

    console.log(`Found ${rows.length} user rows`);

    // Parse users with column mappings (C=name, D=email, E=phone, M=role, N=password)
    const users: User[] = rows
      .map((row: any[]) => ({
        name: row[2] || '', // Column C
        email: row[3] || '', // Column D
        phone: row[4] || '', // Column E
        role: (row[12] || 'consultant').toLowerCase(), // Column M
        password: row[13] || '', // Column N
      }))
      .filter((user: User) => user.email && user.password);

    console.log(`Returning ${users.length} valid users`);

    return new Response(
      JSON.stringify({ users }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
