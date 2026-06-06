/** Theme management (light/dark warm tones). */
import { prefs, type Theme } from '@/services/preferences';
import { icon } from '@/ui/icons';

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelectorAll<HTMLElement>('[data-theme-icon]').forEach((el) => {
    el.innerHTML = icon(theme === 'dark' ? 'sun' : 'moon', 'icon');
  });
}

export function initTheme(): void {
  applyTheme(prefs.theme());
}

export function toggleTheme(): Theme {
  const next: Theme =
    document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  prefs.setTheme(next);
  applyTheme(next);
  return next;
}
