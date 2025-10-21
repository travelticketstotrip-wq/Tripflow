const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    console.log('Adding lead to Google Sheets...');
    
    const lead = await req.json();
    
    if (!lead.travellerName || !lead.phone) {
      throw new Error('Missing required fields: travellerName and phone');
    }

    console.log('Lead data:', lead);

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

    // Prepare row data with correct column mappings
    // Columns: A=tripId, B=date, C=consultant, D=status, E=travellerName, F=?, G=travelDate, 
    // H=travelState, I=?, J=?, K=remarks, L=nights, M=pax, N=hotelCategory, O=mealPlan, P=phone, Q=email
    const row = [
      lead.tripId || '',           // A - Trip ID
      lead.date || '',             // B - Date
      lead.consultant || '',       // C - Consultant
      lead.status || 'Unfollowed', // D - Status
      lead.travellerName || '',    // E - Traveller Name
      '',                          // F - Empty
      lead.travelDate || '',       // G - Travel Date
      lead.travelState || '',      // H - Travel State
      '',                          // I - Empty
      '',                          // J - Empty
      lead.remarks || '',          // K - Remarks
      lead.nights || '',           // L - Nights
      lead.pax || '',              // M - Pax
      lead.hotelCategory || '',    // N - Hotel Category
      lead.mealPlan || '',         // O - Meal Plan
      lead.phone || '',            // P - Phone
      lead.email || '',            // Q - Email
    ];

    console.log('Appending row:', row);

    const worksheetName = 'MASTER DATA';
    const appendResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(worksheetName)}!A:Q:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [row],
        }),
      }
    );

    if (!appendResponse.ok) {
      const errorText = await appendResponse.text();
      console.error('Append failed:', errorText);
      throw new Error(`Failed to append lead: ${errorText}`);
    }

    const result = await appendResponse.json();
    console.log('Lead added successfully:', result);

    return new Response(
      JSON.stringify({ success: true, message: 'Lead added successfully', result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error adding lead:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
