// Google Sheets API integration
export interface GoogleSheetsConfig {
  apiKey: string;
  sheetId: string;
  worksheetNames: string[];
  columnMappings: Record<string, string>;
}

export interface SheetUser {
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'consultant';
  password: string;
}

export interface SheetLead {
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
  remarkHistory?: string[];
}

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

export class GoogleSheetsService {
  private config: GoogleSheetsConfig;

  constructor(config: GoogleSheetsConfig) {
    this.config = config;
  }

  private columnToIndex(col: string): number {
    let index = 0;
    for (let i = 0; i < col.length; i++) {
      index = index * 26 + (col.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
    }
    return index - 1;
  }

  async fetchUsers(): Promise<SheetUser[]> {
    try {
      const worksheetName = this.config.worksheetNames[1] || 'BACKEND SHEET';
      const range = `${worksheetName}!A2:Z1000`;
      const url = `${SHEETS_API_BASE}/${this.config.sheetId}/values/${encodeURIComponent(range)}?key=${this.config.apiKey}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`);
      }
      
      const data = await response.json();
      const rows = data.values || [];
      
      return rows.map((row: any[]) => ({
        name: row[2] || '', // Column C
        email: row[3] || '', // Column D
        phone: row[4] || '', // Column E
        role: (row[12] || 'consultant').toLowerCase() as 'admin' | 'consultant', // Column M
        password: row[13] || '', // Column N
      })).filter((user: SheetUser) => user.email && user.password);
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async fetchLeads(): Promise<SheetLead[]> {
    try {
      const worksheetName = this.config.worksheetNames[0] || 'MASTER DATA';
      const range = `${worksheetName}!A2:Z10000`;
      const url = `${SHEETS_API_BASE}/${this.config.sheetId}/values/${encodeURIComponent(range)}?key=${this.config.apiKey}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch leads: ${response.statusText}`);
      }
      
      const data = await response.json();
      const rows = data.values || [];
      
      const cm = this.config.columnMappings;
      
      const leads = rows.map((row: any[]) => ({
        tripId: row[this.columnToIndex(cm.trip_id || 'A')] || '',
        date: row[this.columnToIndex(cm.date || 'B')] || '',
        consultant: row[this.columnToIndex(cm.consultant || 'C')] || '',
        status: row[this.columnToIndex(cm.status || 'D')] || '',
        travellerName: row[this.columnToIndex(cm.traveller_name || 'E')] || '',
        travelDate: row[this.columnToIndex(cm.travel_date || 'G')] || '',
        travelState: row[this.columnToIndex(cm.travel_state || 'H')] || '',
        remarks: row[this.columnToIndex(cm.remarks || 'K')] || '',
        nights: row[this.columnToIndex(cm.nights || 'L')] || '',
        pax: row[this.columnToIndex(cm.pax || 'M')] || '',
        hotelCategory: row[this.columnToIndex(cm.hotel_category || 'N')] || '',
        mealPlan: row[this.columnToIndex(cm.meal_plan || 'O')] || '',
        phone: row[this.columnToIndex(cm.phone || 'P')] || '',
        email: row[this.columnToIndex(cm.email || 'Q')] || '',
      })).filter((lead: SheetLead) => lead.tripId);

      // Sort by date descending (latest first)
      leads.sort((a, b) => {
        const dateA = new Date(a.date || 0).getTime();
        const dateB = new Date(b.date || 0).getTime();
        return dateB - dateA;
      });

      return leads;
    } catch (error) {
      console.error('Error fetching leads:', error);
      throw error;
    }
  }

  async appendLead(lead: Partial<SheetLead>): Promise<void> {
    try {
      const worksheetName = this.config.worksheetNames[0] || 'MASTER DATA';
      const range = `${worksheetName}!A:Z`;
      const url = `${SHEETS_API_BASE}/${this.config.sheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&key=${this.config.apiKey}`;
      
      const cm = this.config.columnMappings;
      
      // Generate trip ID if not provided
      const tripId = lead.tripId || `T${Date.now()}`;
      const date = lead.date || new Date().toISOString().split('T')[0];
      
      // Create array with exact column mappings
      const maxCol = Math.max(
        ...Object.values(cm).map(col => this.columnToIndex(col as string))
      );
      const row = new Array(maxCol + 1).fill('');
      
      // Fill in the data at the correct column indices
      if (cm.trip_id) row[this.columnToIndex(cm.trip_id)] = tripId;
      if (cm.date) row[this.columnToIndex(cm.date)] = date;
      if (cm.consultant) row[this.columnToIndex(cm.consultant)] = lead.consultant || '';
      if (cm.status) row[this.columnToIndex(cm.status)] = lead.status || 'Unfollowed';
      if (cm.traveller_name) row[this.columnToIndex(cm.traveller_name)] = lead.travellerName || '';
      if (cm.travel_date) row[this.columnToIndex(cm.travel_date)] = lead.travelDate || '';
      if (cm.travel_state) row[this.columnToIndex(cm.travel_state)] = lead.travelState || '';
      if (cm.remarks) row[this.columnToIndex(cm.remarks)] = lead.remarks || '';
      if (cm.nights) row[this.columnToIndex(cm.nights)] = lead.nights || '';
      if (cm.pax) row[this.columnToIndex(cm.pax)] = lead.pax || '';
      if (cm.hotel_category) row[this.columnToIndex(cm.hotel_category)] = lead.hotelCategory || '';
      if (cm.meal_plan) row[this.columnToIndex(cm.meal_plan)] = lead.mealPlan || '';
      if (cm.phone) row[this.columnToIndex(cm.phone)] = lead.phone || '';
      if (cm.email) row[this.columnToIndex(cm.email)] = lead.email || '';
      
      console.log('Appending lead to Google Sheets:', { tripId, date, url });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [row],
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google Sheets API error:', errorText);
        throw new Error(`Failed to append lead: ${response.statusText} - ${errorText}`);
      }
      
      console.log('Lead appended successfully');
    } catch (error) {
      console.error('Error appending lead:', error);
      throw error;
    }
  }

  async updateLead(tripId: string, updates: Partial<SheetLead>): Promise<void> {
    try {
      console.log('Updating lead:', tripId, updates);
      
      // First, find the row number
      const leads = await this.fetchLeads();
      const leadIndex = leads.findIndex(l => l.tripId === tripId);
      
      if (leadIndex === -1) {
        throw new Error('Lead not found');
      }
      
      const rowNumber = leadIndex + 2; // +2 because sheets are 1-indexed and row 1 is header
      const worksheetName = this.config.worksheetNames[0] || 'MASTER DATA';
      
      const cm = this.config.columnMappings;
      
      console.log('Found lead at row:', rowNumber);
      
      // Update each field individually
      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          let column = '';
          switch (key) {
            case 'consultant': column = cm.consultant || 'C'; break;
            case 'status': column = cm.status || 'D'; break;
            case 'remarks': column = cm.remarks || 'K'; break;
            case 'travelDate': column = cm.travel_date || 'G'; break;
            case 'travelState': column = cm.travel_state || 'H'; break;
            case 'nights': column = cm.nights || 'L'; break;
            case 'pax': column = cm.pax || 'M'; break;
            case 'hotelCategory': column = cm.hotel_category || 'N'; break;
            case 'mealPlan': column = cm.meal_plan || 'O'; break;
            case 'phone': column = cm.phone || 'P'; break;
            case 'email': column = cm.email || 'Q'; break;
            default: continue;
          }
          
          const range = `${worksheetName}!${column}${rowNumber}`;
          const url = `${SHEETS_API_BASE}/${this.config.sheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED&key=${this.config.apiKey}`;
          
          console.log(`Updating ${key} at ${range}`);
          
          const response = await fetch(url, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              values: [[value]],
            }),
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to update ${key}:`, errorText);
          }
        }
      }
      
      console.log('Lead updated successfully');
    } catch (error) {
      console.error('Error updating lead:', error);
      throw error;
    }
  }
}

// Settings management using localStorage
export const saveSettings = (config: GoogleSheetsConfig) => {
  localStorage.setItem('googleSheetsConfig', JSON.stringify(config));
};

export const loadSettings = (): GoogleSheetsConfig | null => {
  const stored = localStorage.getItem('googleSheetsConfig');
  if (stored) {
    return JSON.parse(stored);
  }
  return null;
};

export const extractSheetId = (url: string): string => {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : '';
};
