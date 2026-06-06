/** OCTAVE step list and activity feed widgets for the dashboard. */
import { html, raw, type RawHtml } from '@/ui/html';
import { icon } from '@/ui/icons';
import { emptyState } from '@/ui/components';
import type { Repository } from '@/services/repository';

export function renderOctaveSteps(r: Repository): RawHtml {
  const assets = r.get('assets');
  const threats = r.get('assetThreats');
  const risks = r.get('risks');
  const steps = [
    { name: 'Risk Criteria', done: Object.keys(r.get('riskCriteria')).length > 0 },
    { name: 'Asset Profiles', done: assets.length > 0 },
    { name: 'Asset Containers', done: assets.some((a) => a.containers.length > 0) },
    { name: 'Areas of Concern', done: Object.keys(threats).length > 0 },
    { name: 'Threat Scenarios', done: Object.keys(threats).length > 0 },
    { name: 'Identify Risks', done: risks.length > 0 },
    { name: 'Analyze Risks', done: risks.length > 0 },
    { name: 'Mitigations', done: risks.some((x) => x.mitigation) },
  ];
  return html`${steps.map(
    (s) => html`
      <div class="step-item ${s.done ? 'done' : ''}">
        <div class="step-icon">${s.done ? raw(icon('check', 'icon')) : ''}</div>
        <div>
          <div class="step-title">${s.name}</div>
          <div class="step-status">${s.done ? 'Completed' : 'Pending'}</div>
        </div>
      </div>
    `,
  )}`;
}

export function renderActivityFeed(r: Repository): RawHtml {
  const log = r.get('activityLog');
  if (log.length === 0) {
    return emptyState({
      icon: 'clock',
      title: 'No activity yet',
      message: 'Actions you take are recorded here.',
    });
  }
  return html`<div style="display:flex;flex-direction:column;">
    ${log.slice(0, 7).map(
      (a) => html`
        <div
          style="display:flex;gap:11px;align-items:flex-start;padding:9px 0;border-bottom:1px solid var(--border-soft);"
        >
          <span class="dot" style="background:var(--${a.color});margin-top:6px;"></span>
          <div style="flex:1;">
            <div style="font-size:0.85rem;font-weight:600;color:var(--text-primary);">
              ${a.action}
            </div>
            <div style="font-size:0.76rem;color:var(--text-muted);">${a.detail}</div>
          </div>
          <span style="font-size:0.7rem;color:var(--text-muted);white-space:nowrap;"
            >${a.time}</span
          >
        </div>
      `,
    )}
  </div>`;
}
