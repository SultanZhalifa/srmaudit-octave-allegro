/** Application bootstrap — wires services, mounts the shell, restores session. */
import type { AuthUser } from '@/core/types';
import { bus } from '@/core/events';
import { backend } from '@/services/backend';
import { withTimeout } from '@/core/utils';
import { mount } from '@/ui/dom';
import { requireId } from '@/ui/dom';
import { renderLogin } from './login';
import { renderAppShell, updateSyncIndicator } from './layout';
import { navigateTo } from './router';
import { initTheme } from './theme';

const root = () => requireId('app');

/** Render the app shell for a signed-in user and navigate to the dashboard. */
export function mountApp(user: AuthUser): void {
  mount(root(), renderAppShell(user));
  initTheme();
  seedWorkspaceUser(user);
  updateSyncIndicator();
  navigateTo('dashboard');
}

/** Render the login screen. */
export function showLogin(): void {
  mount(root(), renderLogin());
  initTheme();
}

/** Ensure a freshly-signed-in user seeds the roster (real data, not demo). */
function seedWorkspaceUser(user: AuthUser): void {
  const users = backend.repo.get('users');
  if (users.length === 0) {
    backend.repo.set('users', [
      { name: user.name, email: user.email, role: user.role, active: true, system: true },
    ]);
  }
}

/** Entry point: init backend, restore session, render. */
export async function bootstrap(): Promise<void> {
  bus.on('navigate', ({ page }) => navigateTo(page));
  bus.on('sync-updated', () => updateSyncIndicator());

  await backend.init();
  const restored = await withTimeout(backend.restoreSession(), 5000, null);
  if (restored) mountApp(restored);
  else showLogin();
}
