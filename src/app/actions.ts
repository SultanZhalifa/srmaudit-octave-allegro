/**
 * Global action handlers — auth, navigation, theme, sidebar, data import/export.
 * Feature-specific actions are registered inside each feature; these are the
 * cross-cutting ones the shell owns.
 */
import type { PageId } from '@/core/constants';
import { WORKSPACE_KEYS, PAGES } from '@/core/constants';
import type { Role, WorkspaceKey } from '@/core/types';
import { toast } from '@/core/events';
import { backend } from '@/services/backend';
import { logActivity } from '@/services/activity-log';
import { loadExampleData } from '@/services/example-data';
import { onAction, onChange, inputValue } from '@/ui/dom';
import { icon } from '@/ui/icons';
import { closeModal } from '@/ui/modal';
import { navigateTo } from './router';
import { toggleTheme } from './theme';
import { toggleSidebar, updateSyncIndicator } from './layout';
import { handleEvidenceUpload } from '@/features/evidence/evidence';
import { mountApp, showLogin } from './bootstrap';

let authMode: 'signin' | 'signup' = 'signin';

export function registerGlobalActions(): void {
  // ----- Navigation (data-action="nav:<page>") -----
  onAction('modal:close', () => closeModal());

  // Generic nav handler: any action starting with "nav:" routes.
  document.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-action^="nav:"]');
    if (!el) return;
    const page = (el.getAttribute('data-action') ?? '').slice(4) as PageId;
    if (PAGES[page]) navigateTo(page);
  });

  // ----- Sidebar / theme -----
  onAction('sidebar:toggle', () => toggleSidebar());
  onAction('theme:toggle', () => {
    toggleTheme();
    // Re-render pages whose visuals depend on theme colors.
    const themed: PageId[] = ['dashboard', 'compliance', 'report', 'risk', 'settings'];
    if (themed.includes(currentRoute())) navigateTo(currentRoute());
  });

  // ----- Auth -----
  onAction('auth:tab', (el) => setAuthMode((el.dataset.tab as 'signin' | 'signup') ?? 'signin'));
  onAction('auth:togglePassword', (el) => {
    const input = document.getElementById('loginPassword') as HTMLInputElement;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    el.innerHTML = icon(show ? 'eye-off' : 'eye', 'icon');
  });
  onAction('auth:submit', () => (authMode === 'signup' ? signUp() : signIn()));
  onAction('auth:forgot', () => void forgotPassword());
  onAction('auth:logout', () => void logout());

  // ----- Data import/export & example -----
  onAction('data:export', () => exportData());
  onAction('data:import', () => importData());
  onAction('data:example', () => {
    if (
      !window.confirm(
        'Load a complete worked example (President University scenario)? This populates every module with sample data you can edit or reset later.',
      )
    )
      return;
    loadExampleData();
    toast('Example workspace loaded');
    navigateTo('dashboard');
  });

  // ----- Evidence file input change -----
  onChange('evidence:upload', (el) => void handleEvidenceUpload(el as HTMLInputElement));
  document.addEventListener('change', (e) => {
    const t = e.target as HTMLElement;
    if (t.id === 'evFile') void handleEvidenceUpload(t as HTMLInputElement);
  });
}

function currentRoute(): PageId {
  // Lazy import avoids a cycle at module load.
  return (
    (document.querySelector('.nav-item.active')?.getAttribute('data-page') as PageId) ?? 'dashboard'
  );
}

function setAuthMode(mode: 'signin' | 'signup'): void {
  authMode = mode;
  const signup = mode === 'signup';
  document.getElementById('tabSignin')?.classList.toggle('active', !signup);
  document.getElementById('tabSignup')?.classList.toggle('active', signup);
  toggleDisplay('nameGroup', signup);
  toggleDisplay('roleGroup', signup);
  toggleDisplay('forgotRow', !signup);
  const btn = document.getElementById('authSubmitBtn');
  if (btn)
    btn.innerHTML = signup
      ? `${icon('user-plus', 'icon')} Create Account`
      : `${icon('log-in', 'icon')} Sign In`;
}

function toggleDisplay(id: string, show: boolean): void {
  const el = document.getElementById(id);
  if (el) el.style.display = show ? (id === 'forgotRow' ? 'block' : 'block') : 'none';
}

async function signIn(): Promise<void> {
  const email = inputValue('loginEmail');
  const password = (document.getElementById('loginPassword') as HTMLInputElement).value;
  if (!email || !password) return toast('Please fill in email and password', 'error');
  const btn = document.getElementById('authSubmitBtn') as HTMLButtonElement;
  const prev = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `${icon('refresh', 'icon spin')} Signing in…`;
  try {
    const user = await backend.signIn(email, password);
    mountApp(user);
    toast(`Welcome back, ${user.name}`);
  } catch (e) {
    toast((e as Error).message, 'error');
    btn.disabled = false;
    btn.innerHTML = prev;
  }
}

async function signUp(): Promise<void> {
  const name = inputValue('loginName');
  const email = inputValue('loginEmail');
  const password = (document.getElementById('loginPassword') as HTMLInputElement).value;
  const role = inputValue('loginRole') as Role;
  if (!email || !password) return toast('Please fill in email and password', 'error');
  if (password.length < 6) return toast('Password must be at least 6 characters', 'error');
  const btn = document.getElementById('authSubmitBtn') as HTMLButtonElement;
  const prev = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `${icon('refresh', 'icon spin')} Creating…`;
  try {
    const res = await backend.signUp(email, password, name, role);
    if (res.needsConfirm) {
      toast('Account created. Check your email to confirm, then sign in.', 'success');
      setAuthMode('signin');
      btn.disabled = false;
      btn.innerHTML = `${icon('log-in', 'icon')} Sign In`;
    } else if (res.user) {
      mountApp(res.user);
      toast(`Welcome, ${res.user.name}. Workspace ready.`);
    }
  } catch (e) {
    toast((e as Error).message, 'error');
    btn.disabled = false;
    btn.innerHTML = prev;
  }
}

async function forgotPassword(): Promise<void> {
  const email = inputValue('loginEmail');
  if (!email) return toast('Enter your email first', 'error');
  try {
    await backend.resetPassword(email);
    toast('Password reset email sent', 'success');
  } catch (e) {
    toast((e as Error).message, 'error');
  }
}

async function logout(): Promise<void> {
  await backend.signOut();
  showLogin();
  toast('Signed out', 'info');
}

function exportData(): void {
  const data: Record<string, unknown> = {
    _meta: { app: 'SRMAudit 2026', exported: new Date().toISOString(), user: backend.user?.email },
  };
  for (const key of WORKSPACE_KEYS) data[key] = backend.repo.get(key);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `SRMAudit_Backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast('Workspace exported');
  logActivity('Data Exported', 'JSON backup downloaded', 'info');
}

function importData(): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = () => {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as Record<string, unknown>;
        if (!window.confirm('Importing will overwrite your current workspace data. Continue?'))
          return;
        for (const key of WORKSPACE_KEYS) {
          if (data[key] !== undefined) backend.repo.set(key as WorkspaceKey, data[key] as never);
        }
        navigateTo('dashboard');
        toast('Workspace imported');
        logActivity('Data Imported', 'Restored from JSON backup', 'info');
      } catch {
        toast('Invalid backup file', 'error');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

export { updateSyncIndicator };
