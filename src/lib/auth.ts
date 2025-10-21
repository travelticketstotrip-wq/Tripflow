import { GoogleSheetsBackendService, SheetUser } from './googleSheetsBackend';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'admin' | 'consultant';
}

export interface AuthSession {
  user: AuthUser;
  token: string;
}

const DEFAULT_ADMIN = {
  email: 'ticketstotrip.com@gmail.com',
  password: '123456',
  name: 'Default Admin',
  phone: '',
  role: 'admin' as const,
};

export const authLib = {
  async login(email: string, password: string): Promise<{ session: AuthSession | null; error: Error | null }> {
    try {
      // Check default admin first
      if (email === DEFAULT_ADMIN.email && password === DEFAULT_ADMIN.password) {
        const user: AuthUser = {
          id: '00000000-0000-0000-0000-000000000001',
          email: DEFAULT_ADMIN.email,
          name: DEFAULT_ADMIN.name,
          phone: DEFAULT_ADMIN.phone,
          role: DEFAULT_ADMIN.role,
        };
        
        const session: AuthSession = {
          user,
          token: btoa(`${email}:${password}:${Date.now()}`),
        };
        
        localStorage.setItem('auth_session', JSON.stringify(session));
        return { session, error: null };
      }

      // Check Google Sheets users
      const sheetsService = new GoogleSheetsBackendService();
      const users = await sheetsService.fetchUsers();
      
      const matchedUser = users.find(
        (u: SheetUser) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (!matchedUser) {
        return { session: null, error: new Error('Invalid email or password') };
      }

      const user: AuthUser = {
        id: btoa(matchedUser.email),
        email: matchedUser.email,
        name: matchedUser.name,
        phone: matchedUser.phone,
        role: matchedUser.role,
      };

      const session: AuthSession = {
        user,
        token: btoa(`${email}:${password}:${Date.now()}`),
      };

      localStorage.setItem('auth_session', JSON.stringify(session));
      return { session, error: null };
    } catch (error: any) {
      return { session: null, error };
    }
  },

  async logout(): Promise<void> {
    localStorage.removeItem('auth_session');
  },

  getSession(): AuthSession | null {
    const stored = localStorage.getItem('auth_session');
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  },

  isAuthenticated(): boolean {
    return !!this.getSession();
  },
};
