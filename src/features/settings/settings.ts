/** Settings feature — AI provider, workspace, data, danger zone. */
import { html, raw, type RawHtml } from '@/ui/html';
import { icon } from '@/ui/icons';
import { button } from '@/ui/components';
import { onAction, inputValue } from '@/ui/dom';
import { prefs } from '@/services/preferences';
import { detectProvider } from '@/services/ai-service';
import { backend } from '@/services/backend';
import type { Feature } from '../feature';
import { repo, toast, confirmAction, navigate } from '../helpers';
import { bus } from '@/core/events';

let registered = false;

function register(): void {
  if (registered) return;
  registered = true;

  onAction('settings:saveKey', () => {
    const key = inputValue('aiKeyInput');
    if (!key) return toast('Enter an API key', 'error');
    prefs.setAiKey(key);
    toast('API key saved');
    navigate('settings');
  });

  onAction('settings:clearKey', () => {
    prefs.clearAiKey();
    toast('API key removed', 'info');
    navigate('settings');
  });

  onAction('settings:toggleKeyVisibility', (el) => {
    const input = document.getElementById('aiKeyInput') as HTMLInputElement;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    el.innerHTML = icon(show ? 'eye-off' : 'eye', 'icon');
  });

  onAction('settings:reset', () => {
    if (
      !confirmAction(
        'This permanently clears ALL workspace data (assets, risks, controls, evidence, findings). Continue?',
      )
    )
      return;
    repo().reset();
    bus.emit('sync-updated', undefined);
    toast('Workspace data reset', 'warning');
    navigate('dashboard');
  });
}

export const settingsFeature: Feature = {
  render(): RawHtml {
    register();
    const key = prefs.aiKey();
    const theme = prefs.theme();
    const provider = detectProvider(key);
    const cloud = backend.isCloud();
    return html`
      <div class="page-header fade-up">
        <h1>Settings</h1>
        <p>Workspace configuration, AI provider, and data management</p>
      </div>
      <div class="grid-2 stagger">
        <div class="card">
          <div class="card-header">
            <h3>${raw(icon('sparkles', 'icon'))} AI Provider</h3>
            ${key
              ? html`<span class="badge badge-success">${provider} connected</span>`
              : raw('<span class="badge badge-warning">Not configured</span>')}
          </div>
          <p style="font-size:0.84rem;margin-bottom:12px;">
            Add your own API key for live, generative AI. We auto-detect the provider from the key.
            Without a key the assistant uses the built-in knowledge base.
          </p>
          <div class="form-group">
            <label>API Key</label>
            <div class="input-wrap">
              <input
                class="form-control"
                id="aiKeyInput"
                type="password"
                placeholder="AIza…  or  sk-or-v1-…"
                value="${key}"
              />
              <button class="pwd-toggle-btn" data-action="settings:toggleKeyVisibility">
                ${raw(icon('eye', 'icon'))}
              </button>
            </div>
          </div>
          <div class="btn-group">
            ${button({
              label: 'Save Key',
              icon: 'save',
              action: 'settings:saveKey',
              variant: 'primary',
              size: 'sm',
            })}
            ${key
              ? button({ label: 'Remove', icon: 'trash', action: 'settings:clearKey', size: 'sm' })
              : ''}
          </div>
          <p style="font-size:0.74rem;color:var(--text-muted);margin-top:10px;">
            ${raw(icon('lock', 'icon-sm'))} The key is stored only in this browser and is never
            synced or shared.
          </p>
        </div>
        <div class="card">
          <div class="card-header"><h3>${raw(icon('settings', 'icon'))} Workspace</h3></div>
          <div
            class="flex items-center justify-between"
            style="padding:10px 0;border-bottom:1px solid var(--border-soft);"
          >
            <div>
              <strong>Storage mode</strong>
              <div style="font-size:0.78rem;color:var(--text-muted);">
                ${cloud
                  ? 'Supabase cloud — synced across devices'
                  : 'Local browser (IndexedDB) — set Supabase env vars for cloud'}
              </div>
            </div>
            <span class="badge ${cloud ? 'badge-success' : 'badge-warning'}"
              >${cloud ? 'Cloud' : 'Local'}</span
            >
          </div>
          <div
            class="flex items-center justify-between"
            style="padding:10px 0;border-bottom:1px solid var(--border-soft);"
          >
            <div>
              <strong>Theme</strong>
              <div style="font-size:0.78rem;color:var(--text-muted);">
                Switch between light and dark warm tones
              </div>
            </div>
            ${button({
              label: theme === 'dark' ? 'Light' : 'Dark',
              icon: theme === 'dark' ? 'sun' : 'moon',
              action: 'theme:toggle',
              size: 'sm',
            })}
          </div>
          <div class="flex items-center justify-between" style="padding:10px 0;">
            <div>
              <strong>Data backup</strong>
              <div style="font-size:0.78rem;color:var(--text-muted);">
                Export or restore your full workspace
              </div>
            </div>
            <div class="btn-group">
              ${button({ label: '', icon: 'download', action: 'data:export', size: 'sm' })}${button(
                { label: '', icon: 'upload', action: 'data:import', size: 'sm' },
              )}
            </div>
          </div>
        </div>
      </div>
      <div class="card fade-up">
        <div class="card-header"><h3>${raw(icon('alert-triangle', 'icon'))} Danger Zone</h3></div>
        <div class="flex items-center justify-between flex-wrap gap-1">
          <div>
            <strong>Reset workspace data</strong>
            <div style="font-size:0.78rem;color:var(--text-muted);">
              Permanently clears all assets, risks, controls, evidence and findings for your
              account.
            </div>
          </div>
          ${button({
            label: 'Reset all data',
            icon: 'trash',
            action: 'settings:reset',
            variant: 'danger',
            size: 'sm',
          })}
        </div>
      </div>
    `;
  },
};
