/**
 * Device-local preferences (theme, AI API key). Stored in localStorage only —
 * never synced to the cloud, never shared. The AI key is the user's own secret.
 */
const PREFIX = 'srm_pref_';

export type Theme = 'light' | 'dark';

export const prefs = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw == null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown): void {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  },
  remove(key: string): void {
    localStorage.removeItem(PREFIX + key);
  },

  // Typed convenience accessors
  theme(): Theme {
    return this.get<Theme>('theme', 'light');
  },
  setTheme(theme: Theme): void {
    this.set('theme', theme);
  },
  aiKey(): string {
    return this.get<string>('aiKey', '');
  },
  setAiKey(key: string): void {
    this.set('aiKey', key);
  },
  clearAiKey(): void {
    this.remove('aiKey');
  },
};
