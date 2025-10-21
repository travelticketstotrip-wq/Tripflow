import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function syncUsers(
  serviceAccountJson: string,
  sheetUrl: string,
  worksheetName: string
) {
  console.log('Starting user sync from BACKEND SHEET...');

  try {
    let credentials;
    try {
      credentials = JSON.parse(serviceAccountJson);
    } catch (parseError) {
      throw new Error('Invalid JSON format for Service Account. Please check your Google Service Account JSON in Admin Settings.');
    }
    
    // Extract sheet ID from URL
    const sheetIdMatch = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!sheetIdMatch) {
      throw new Error('Invalid Google Sheet URL format. Expected: https://docs.google.com/spreadsheets/d/SHEET_ID/...');
    }
    const spreadsheetId = sheetIdMatch[1];

    // Get OAuth token
    const jwtHeader = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const now = Math.floor(Date.now() / 1000);
    const jwtClaimSet = btoa(JSON.stringify({
      iss: credentials.client_email,
      scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    }));

    const jwtSignature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      await crypto.subtle.importKey(
        'pkcs8',
        Uint8Array.from(atob(credentials.private_key.replace(/-----BEGIN PRIVATE KEY-----|\n|-----END PRIVATE KEY-----/g, '')), c => c.charCodeAt(0)),
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
      throw new Error(`Token request failed: ${tokenResponse.statusText}`);
    }

    const { access_token } = await tokenResponse.json();

    // Fetch user data from BACKEND SHEET
    const sheetResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(worksheetName)}!A2:Z1000`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    if (!sheetResponse.ok) {
      throw new Error(`Sheet fetch failed: ${sheetResponse.statusText}`);
    }

    const sheetData = await sheetResponse.json();
    const dataRows = sheetData.values || [];

    console.log(`Found ${dataRows.length} user rows in BACKEND SHEET`);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let synced = 0;

    for (const row of dataRows) {
      const consultantName = row[2]?.trim(); // Column C
      const consultantEmail = row[3]?.trim(); // Column D
      const consultantPhone = row[4]?.trim(); // Column E
      const role = row[12]?.trim()?.toLowerCase(); // Column M
      const password = row[13]?.trim(); // Column N

      if (!consultantEmail || !password) {
        console.log('Skipping row - missing email or password');
        continue;
      }

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', consultantEmail)
        .maybeSingle();

      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: consultantName || '',
            phone: consultantPhone || '',
            password_hash: password, // Store plain password for now
            is_approved: true,
          })
          .eq('id', existingProfile.id);

        if (updateError) {
          console.error('Error updating profile:', updateError);
          continue;
        }

        // Update or insert role
        const userRole = (role === 'admin' || role === 'consultant') ? role : 'consultant';
        
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', existingProfile.id);

        await supabase
          .from('user_roles')
          .insert({ user_id: existingProfile.id, role: userRole });

        synced++;
      } else {
        // Create new profile
        const userId = crypto.randomUUID();
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: consultantEmail,
            full_name: consultantName || '',
            phone: consultantPhone || '',
            password_hash: password,
            is_approved: true,
          });

        if (insertError) {
          console.error('Error inserting profile:', insertError);
          continue;
        }

        // Insert role
        const userRole = (role === 'admin' || role === 'consultant') ? role : 'consultant';
        
        await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: userRole });

        synced++;
      }
    }

    console.log(`User sync completed: ${synced} users synced`);
    return { synced };

  } catch (error) {
    console.error('Error syncing users:', error);
    throw error;
  }
}
