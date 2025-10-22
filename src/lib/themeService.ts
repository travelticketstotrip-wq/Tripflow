// Dark/Light mode management
import { Preferences } from '@capacitor/preferences';

const THEME_KEY = 'app_theme';

export type Theme = 'light' | 'dark';

class ThemeService {
  private currentTheme: Theme = 'light';

  async initialize(): Promise<void> {
    const { value } = await Preferences.get({ key: THEME_KEY });
    this.currentTheme = (value as Theme) || 'light';
    this.applyTheme(this.currentTheme);
  }

  async setTheme(theme: Theme): Promise<void> {
    this.currentTheme = theme;
    await Preferences.set({ key: THEME_KEY, value: theme });
    this.applyTheme(theme);
  }

  getTheme(): Theme {
    return this.currentTheme;
  }

  async toggleTheme(): Promise<Theme> {
    const newTheme: Theme = this.currentTheme === 'light' ? 'dark' : 'light';
    await this.setTheme(newTheme);
    return newTheme;
  }

  private applyTheme(theme: Theme): void {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}

export const themeService = new ThemeService();
