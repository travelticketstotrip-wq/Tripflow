import { createNotification, AppNotification } from './notifications';
import { useSheetService } from '@/hooks/useSheetService';
import { GoogleSheetsService } from '@/lib/googleSheets';
import { secureStorage } from '@/lib/secureStorage';

function uuid() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return (crypto as any).randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const notifyUser = async (email: string, title: string, message: string, type: AppNotification['type'] = 'general') => {
  try {
    const sheetService = await useSheetService();
    await createNotification(sheetService, {
      id: uuid(), title, message, type, createdAt: new Date().toISOString(),
      read: false, userEmail: email
    });
  } catch (e) {
    console.warn('notifyUser failed (non-blocking):', e);
  }
};

export const notifyAll = async (title: string, message: string, type: AppNotification['type'] = 'general') => {
  try {
    const sheetService = await useSheetService();

    // Prefer backend users (BACKEND SHEET via GoogleSheetsService)
    const credentials = await secureStorage.getCredentials();
    let localServiceAccountJson: string | undefined;
    try { localServiceAccountJson = localStorage.getItem('serviceAccountJson') || undefined; } catch {}

    let emails: string[] = [];
    if (credentials) {
      try {
        const gs = new GoogleSheetsService({
          apiKey: credentials.googleApiKey || '',
          serviceAccountJson: credentials.googleServiceAccountJson || localServiceAccountJson,
          sheetId: credentials.googleSheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)?.[1] || '',
          worksheetNames: credentials.worksheetNames,
          columnMappings: credentials.columnMappings,
        });
        const users = await gs.fetchUsers();
        emails = users.map(u => String(u.email || '').trim()).filter(Boolean);
      } catch (err) {
        console.warn('Falling back to Users sheet for emails:', err);
      }
    }

    // Fallback to Users worksheet (if present)
    if (emails.length === 0) {
      try {
        const rows = await sheetService.getRows('Users');
        emails = rows.map((u: any[]) => (u?.[1] || u?.email || u?.Email || u?.E || u?.D)).map((e: any) => String(e || '').trim()).filter(Boolean);
      } catch (err) {
        console.warn('Users worksheet not available, notifyAll will be skipped:', err);
      }
    }

    const uniqueEmails = Array.from(
      emails.reduce((acc, raw) => {
        const trimmed = String(raw || '').trim();
        if (!trimmed) return acc;
        const key = trimmed.toLowerCase();
        if (!acc.has(key)) acc.set(key, trimmed);
        return acc;
      }, new Map<string, string>()).values()
    );

    if (uniqueEmails.length === 0) return; // Nothing to do

    for (const email of uniqueEmails) {
      await createNotification(sheetService, {
        id: uuid(), title, message, type, createdAt: new Date().toISOString(),
        read: false, userEmail: email
      });
    }
  } catch (e) {
    console.warn('notifyAll failed (non-blocking):', e);
  }
};

export const notifyAdmin = async (title: string, message: string) => {
  try {
    const sheetService = await useSheetService();
    const credentials = await secureStorage.getCredentials();
    let localServiceAccountJson: string | undefined;
    try { localServiceAccountJson = localStorage.getItem('serviceAccountJson') || undefined; } catch {}

    type UserLike = { email: string; role: string };
    let users: UserLike[] = [];

    if (credentials) {
      try {
        const gs = new GoogleSheetsService({
          apiKey: credentials.googleApiKey || '',
          serviceAccountJson: credentials.googleServiceAccountJson || localServiceAccountJson,
          sheetId: credentials.googleSheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)?.[1] || '',
          worksheetNames: credentials.worksheetNames,
          columnMappings: credentials.columnMappings,
        });
        const fetched = await gs.fetchUsers();
        users = fetched.map(u => ({ email: String(u.email || '').trim(), role: String(u.role || '').toLowerCase() }));
      } catch (err) {
        console.warn('Falling back to Users sheet for admin emails:', err);
      }
    }

    if (users.length === 0) {
      try {
        const rows = await sheetService.getRows('Users');
        users = rows.map((u: any[]) => ({
          email: String(u?.[1] || u?.email || u?.Email || u?.E || u?.D || '').trim(),
          role: String(u?.role || u?.M || u?.[12] || '').toLowerCase(),
        }));
      } catch (err) {
        console.warn('Users worksheet not available, notifyAdmin will be skipped:', err);
      }
    }

    const uniqueAdmins = Array.from(
      users.reduce((acc, u) => {
        if (!u.email) return acc;
        if (!u.role.includes('admin')) return acc;
        const key = u.email.toLowerCase();
        if (!acc.has(key)) acc.set(key, u.email);
        return acc;
      }, new Map<string, string>()).values()
    );

    for (const email of uniqueAdmins) {
      await createNotification(sheetService, {
        id: uuid(), title, message, type: 'admin', createdAt: new Date().toISOString(),
        read: false, userEmail: email
      });
    }
  } catch (e) {
    console.warn('notifyAdmin failed (non-blocking):', e);
  }
};
