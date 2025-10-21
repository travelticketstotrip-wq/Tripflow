export async function syncActivityLogsToSheet(
  supabaseClient: any,
  accessToken: string,
  spreadsheetId: string
) {
  try {
    // Fetch all activity logs with lead details
    const { data: activities, error } = await supabaseClient
      .from('activity_logs')
      .select(`
        *,
        leads!inner(trip_id, traveller_name, phone_number)
      `)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) throw error;
    if (!activities || activities.length === 0) return;

    // Prepare rows for Google Sheets
    const rows = activities.map((activity: any) => [
      activity.leads.trip_id,
      activity.leads.traveller_name,
      activity.leads.phone_number,
      activity.activity_type,
      new Date(activity.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      activity.notes || '',
      activity.duration_seconds ? `${Math.floor(activity.duration_seconds / 60)}m ${activity.duration_seconds % 60}s` : '',
      activity.call_status || ''
    ]);

    // Check if "Activity Logs" sheet exists, create if not
    const sheetsResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    const sheetsData = await sheetsResponse.json();
    const activitySheetExists = sheetsData.sheets?.some(
      (sheet: any) => sheet.properties.title === 'Activity Logs'
    );

    if (!activitySheetExists) {
      // Create Activity Logs sheet
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            requests: [{
              addSheet: {
                properties: {
                  title: 'Activity Logs',
                  gridProperties: {
                    rowCount: 1000,
                    columnCount: 8
                  }
                }
              }
            }]
          })
        }
      );

      // Add headers
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Activity Logs!A1:H1:append?valueInputOption=RAW`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            values: [[
              'Trip ID',
              'Customer Name',
              'Phone',
              'Activity Type',
              'Date/Time',
              'Notes',
              'Duration',
              'Call Status'
            ]]
          })
        }
      );
    }

    // Clear existing data (except header)
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Activity Logs!A2:H:clear`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Write activity logs
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Activity Logs!A2:append?valueInputOption=RAW`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values: rows })
      }
    );

    console.log(`Successfully synced ${activities.length} activity logs to Google Sheets`);
  } catch (error) {
    console.error('Error syncing activity logs to sheet:', error);
    throw error;
  }
}
