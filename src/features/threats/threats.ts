/** Threats & vulnerabilities feature (OCTAVE module 4). */
import { html, raw, type RawHtml } from '@/ui/html';
import { icon } from '@/ui/icons';
import { button, emptyState } from '@/ui/components';
import { onAction } from '@/ui/dom';
import { openModal, closeModal } from '@/ui/modal';
import {
  VULNERABILITIES,
  findVulnerability,
  vulnerabilityCategories,
} from '@/data/vulnerabilities';
import { getRiskLevel } from '@/data/risk-levels';
import { getFramework } from '@/data/frameworks';
import { hasLiveAi, callAi } from '@/services/ai-service';
import { logActivity } from '@/services/activity-log';
import type { Feature } from '../feature';
import { repo, toast, navigate } from '../helpers';

let registered = false;

function register(): void {
  if (registered) return;
  registered = true;

  onAction('threat:select', (el) => {
    const i = Number(el.dataset.index);
    const a = repo().get('assets')[i];
    if (!a) return;
    const selected = repo().get('assetThreats')[a.name] ?? [];
    openModal({
      title: `Select Vulnerabilities — ${a.name}`,
      large: true,
      body: html`
        <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:14px;">
          Select vulnerabilities relevant to this asset. Use Smart Suggest for AI-assisted selection
          (requires an API key).
        </p>
        ${vulnerabilityCategories().map(
          (cat) => html`
            <div class="check-group-title">${cat}</div>
            ${VULNERABILITIES.filter((v) => v.category === cat).map(
              (v) =>
                html`<label class="check-row">
                  <input
                    type="checkbox"
                    id="vuln_${v.id}"
                    value="${v.id}"
                    ${selected.includes(v.id) ? raw('checked') : ''}
                  />
                  <span>${v.name}</span
                  ><span class="check-meta"
                    >${v.defaultLikelihood}×${v.defaultImpact}=${v.defaultLikelihood *
                    v.defaultImpact}</span
                  >
                </label>`,
            )}
          `,
        )}
      `,
      footer: html`
        ${button({
          label: 'Smart Suggest',
          icon: 'sparkles',
          action: 'threat:suggest',
          attrs: `id="smartSuggestBtn" data-index="${i}"`,
        })}
        ${button({
          label: 'Save Selection',
          icon: 'save',
          action: 'threat:save',
          variant: 'primary',
          attrs: `data-asset="${encodeURIComponent(a.name)}"`,
        })}
      `,
    });
  });

  onAction('threat:save', (el) => {
    const name = decodeURIComponent(el.dataset.asset ?? '');
    const ids = Array.from(
      document.querySelectorAll<HTMLInputElement>('.modal-body input:checked'),
    ).map((c) => c.value);
    const threats = repo().get('assetThreats');
    threats[name] = ids;
    repo().set('assetThreats', threats);
    logActivity('Threats Updated', name, 'warning');
    closeModal();
    toast(`${ids.length} vulnerabilities saved`);
    navigate('threats');
  });

  onAction('threat:suggest', async (el) => {
    const i = Number(el.dataset.index);
    const a = repo().get('assets')[i];
    if (!a) return;
    if (!hasLiveAi()) return toast('Add an AI API key in Settings to use Smart Suggest', 'warning');
    const btn = el as HTMLButtonElement;
    btn.disabled = true;
    const prev = btn.innerHTML;
    btn.innerHTML = `${icon('refresh', 'icon spin')} Thinking…`;
    const list = VULNERABILITIES.map((v) => `${v.id}: ${v.name} (${v.description})`).join('\n');
    const prompt = `As a cybersecurity expert, choose which OWASP vulnerabilities are most relevant to this asset.\nAsset: ${a.name}\nType: ${a.type}\nContainers: ${a.containers.join(', ')}\nDescription: ${a.description || 'N/A'}\n\nVulnerabilities:\n${list}\n\nReply ONLY with a comma-separated list of IDs (e.g. VULN-001, VULN-005).`;
    try {
      const reply = await callAi(prompt, '', 120);
      const ids = reply.match(/VULN-\d+/g) ?? [];
      ids.forEach((id) => {
        const cb = document.getElementById(`vuln_${id}`) as HTMLInputElement | null;
        if (cb) cb.checked = true;
      });
      toast(
        ids.length
          ? `AI suggested ${ids.length} vulnerabilities`
          : 'AI returned no specific suggestions',
        ids.length ? 'success' : 'warning',
      );
    } catch (e) {
      toast('AI request failed: ' + (e as Error).message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = prev;
    }
  });
}

export const threatsFeature: Feature = {
  render(): RawHtml {
    register();
    const assets = repo().get('assets');
    const threats = repo().get('assetThreats');
    if (assets.length === 0) {
      return html`
        <div class="page-header fade-up">
          <h1>Threat &amp; Vulnerability Identification</h1>
          <p>OCTAVE Allegro Steps 4 &amp; 5 — OWASP-based</p>
        </div>
        <div class="card">
          ${emptyState({
            icon: 'crosshair',
            title: 'No assets to assess',
            message: 'Register information assets in Module 3 first.',
            action: button({
              label: 'Go to Asset Inventory',
              icon: 'arrow-right',
              action: 'nav:assets',
              variant: 'primary',
              size: 'sm',
            }),
          })}
        </div>
      `;
    }
    return html`
      <div class="page-header fade-up">
        <h1>Threat &amp; Vulnerability Identification</h1>
        <p>OCTAVE Allegro Steps 4 &amp; 5 — map OWASP vulnerabilities to each asset</p>
      </div>
      <div class="card fade-up">
        <div class="card-header">
          <h3>${raw(icon('crosshair', 'icon'))} Select an Asset to Assess</h3>
        </div>
        <div class="flex flex-wrap gap-1">
          ${assets.map((a, i) => {
            const sel = threats[a.name] ?? [];
            return html`<button
              class="btn ${sel.length ? 'btn-primary' : 'btn-secondary'} btn-sm"
              data-action="threat:select"
              data-index="${i}"
            >
              ${a.name}${sel.length ? ` · ${sel.length}` : ''}
            </button>`;
          })}
        </div>
      </div>
      ${Object.keys(threats).length > 0
        ? html`<div class="card fade-up">
            <div class="card-header">
              <h3>${raw(icon('list-checks', 'icon'))} Vulnerability Summary</h3>
            </div>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Vulnerability</th>
                    <th>Category</th>
                    <th>L</th>
                    <th>I</th>
                    <th>Score</th>
                    <th>ISO 27001</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.entries(threats).flatMap(([asset, ids]) =>
                    ids.map((id) => {
                      const v = findVulnerability(id);
                      if (!v) return html``;
                      const sc = v.defaultLikelihood * v.defaultImpact;
                      const lv = getRiskLevel(sc);
                      return html`<tr>
                        <td>${asset}</td>
                        <td><strong>${v.name}</strong></td>
                        <td><span class="badge">${v.category}</span></td>
                        <td>${v.defaultLikelihood}</td>
                        <td>${v.defaultImpact}</td>
                        <td>
                          <span class="badge badge-${lv.label.toLowerCase()}"
                            >${sc} ${lv.label}</span
                          >
                        </td>
                        <td style="font-size:0.76rem;color:var(--text-muted);">
                          ${getFramework(v.category).iso}
                        </td>
                      </tr>`;
                    }),
                  )}
                </tbody>
              </table>
            </div>
          </div>`
        : ''}
    `;
  },
};
