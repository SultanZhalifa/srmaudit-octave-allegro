/** Audit lifecycle readiness gauge for the dashboard. */
import { html, raw, type RawHtml } from '@/ui/html';
import type { Repository } from '@/services/repository';

export function renderReadiness(r: Repository): RawHtml {
  const assets = r.get('assets');
  const threats = r.get('assetThreats');
  const stages = [
    { name: 'Profile', met: Boolean(r.get('organization').name) },
    { name: 'Assets', met: assets.length > 0 },
    { name: 'Mapping', met: assets.some((a) => a.containers.length > 0) },
    { name: 'Threats', met: Object.keys(threats).length > 0 },
    { name: 'Risks', met: r.get('risks').length > 0 },
    { name: 'Controls', met: r.get('auditChecklist').length > 0 },
    { name: 'Evidence', met: r.get('evidence').length > 0 },
    { name: 'Findings', met: r.get('findings').length > 0 },
  ];
  const done = stages.filter((s) => s.met).length;
  const pct = Math.round((done / stages.length) * 100);

  return html`
    <div class="readiness-card fade-up">
      <div class="readiness-gauge">
        <svg viewBox="0 0 100 100">
          <circle class="ring-bg" cx="50" cy="50" r="45" />
          <circle class="ring-fill" cx="50" cy="50" r="45" style="--pct:${pct}" />
        </svg>
        <div class="readiness-text">
          <span class="pct">${pct}%</span><span class="lbl">Ready</span>
        </div>
      </div>
      <div class="readiness-body">
        <h4>Audit Lifecycle Progress</h4>
        <div class="stage-track">
          ${stages.map(
            (s, i) => html`
              ${i > 0 ? raw('<div class="stage-line"></div>') : ''}
              <div class="stage-dot ${s.met ? 'done' : ''}">
                <span class="num">${s.met ? '' : i + 1}</span><span class="name">${s.name}</span>
              </div>
            `,
          )}
        </div>
      </div>
    </div>
  `;
}
