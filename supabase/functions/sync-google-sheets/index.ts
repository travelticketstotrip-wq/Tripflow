import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { syncUsers } from './sync-users.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log('Fetching settings from database...');
    
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('google_service_account_json, google_sheet_url, worksheet_names')
      .limit(1)
      .single();

    if (settingsError) {
      console.error('Settings fetch error:', settingsError);
      throw new Error('Unable to fetch settings from database');
    }

    if (!settings?.google_service_account_json || !settings?.google_sheet_url) {
      throw new Error('Invalid or missing Google credentials. Please configure Google Sheet URL and Service Account JSON in Admin Settings panel.');
    }

    // Validate JSON format
    try {
      JSON.parse(settings.google_service_account_json);
    } catch (parseError) {
      throw new Error('Invalid Google Service Account JSON format. Please check and re-paste the JSON in Admin Settings.');
    }

    const worksheetNames = (settings.worksheet_names as string[]) || ['MASTER DATA', 'BACKEND SHEET'];
    console.log('Using worksheets:', worksheetNames);

    // Sync users from BACKEND SHEET
    console.log('Starting user sync...');
    const userResult = await syncUsers(
      settings.google_service_account_json, 
      settings.google_sheet_url, 
      worksheetNames[1] || 'BACKEND SHEET'
    );

    console.log('Sync completed successfully');
    return new Response(
      JSON.stringify({ 
        message: 'Sync completed successfully',
        usersSynced: userResult.synced
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Sync failed',
        details: 'Check Admin Settings: Ensure Google Sheet URL and Service Account JSON are correctly configured'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
