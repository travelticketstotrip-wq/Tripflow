// Google Sheets backend via edge functions
import { supabase } from "@/integrations/supabase/client";

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

export interface SheetUser {
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'consultant';
  password: string;
}

export class GoogleSheetsBackendService {
  async fetchLeads(): Promise<SheetLead[]> {
    try {
      console.log('Fetching leads via edge function...');
      const { data, error } = await supabase.functions.invoke('google-sheets-fetch-leads');
      
      if (error) throw error;
      if (!data || !data.leads) throw new Error('No leads data received');
      
      console.log(`Fetched ${data.leads.length} leads`);
      return data.leads;
    } catch (error: any) {
      console.error('Error fetching leads:', error);
      throw new Error(error.message || 'Failed to fetch leads');
    }
  }

  async fetchUsers(): Promise<SheetUser[]> {
    try {
      console.log('Fetching users via edge function...');
      const { data, error } = await supabase.functions.invoke('google-sheets-fetch-users');
      
      if (error) throw error;
      if (!data || !data.users) throw new Error('No users data received');
      
      console.log(`Fetched ${data.users.length} users`);
      return data.users;
    } catch (error: any) {
      console.error('Error fetching users:', error);
      throw new Error(error.message || 'Failed to fetch users');
    }
  }

  async updateLead(tripId: string, updates: Partial<SheetLead>): Promise<void> {
    try {
      console.log(`Updating lead ${tripId} via edge function...`, updates);
      const { data, error } = await supabase.functions.invoke('google-sheets-update-lead', {
        body: { tripId, updates }
      });
      
      if (error) throw error;
      console.log('Lead updated successfully:', data);
    } catch (error: any) {
      console.error('Error updating lead:', error);
      throw new Error(error.message || 'Failed to update lead');
    }
  }

  async appendLead(lead: Partial<SheetLead>): Promise<void> {
    try {
      console.log('Adding lead via edge function...', lead);
      const { data, error } = await supabase.functions.invoke('google-sheets-add-lead', {
        body: lead
      });
      
      if (error) throw error;
      console.log('Lead added successfully:', data);
    } catch (error: any) {
      console.error('Error adding lead:', error);
      throw new Error(error.message || 'Failed to add lead');
    }
  }
}
