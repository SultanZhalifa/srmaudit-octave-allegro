/** Compliance scoring feature (OCTAVE module 8). */
import { html, raw, type RawHtml } from '@/ui/html';
import { icon } from '@/ui/icons';
import { cssVar } from '@/ui/chart';
import { getComplianceStats } from '@/services/engines/compliance-engine';
import type { Feature } from '../feature';
import { repo } from '../helpers';

function row(label: string, count: number, color: string): RawHtml {
  return html`<div
    class="flex items-center gap-1"
    style="padding:10px 0;border-bottom:1px solid var(--border-soft);"
  >
    <span class="dot" style="background:${color};"></span
    ><span style="flex:1;font-size:0.86rem;">${label}</span><strong>${count}</strong>
  </div>`;
}

export const complianceFeature: Feature = {
  render(): RawHtml {
    const checklist = repo().get('auditChecklist');
    const stats = getComplianceStats(checklist);
    const color =
      stats.pct >= 85
        ? cssVar('--success')
        : stats.pct >= 60
          ? cssVar('--warning')
          : cssVar('--danger');
    const circ = 2 * Math.PI * 80;
    const offset = circ - (stats.pct / 100) * circ;
    return html`
      <div class="page-header fade-up">
        <h1>Compliance Scoring</h1>
        <p>Automated compliance measurement from your audit checklist results</p>
      </div>
      <div class="grid-2 stagger">
        <div class="card text-center">
          <div class="card-header">
            <h3>${raw(icon('bar-chart', 'icon'))} Overall Compliance</h3>
          </div>
          <div class="compliance-gauge">
            <svg viewBox="0 0 200 200">
              <circle class="gauge-bg" cx="100" cy="100" r="80" />
              <circle
                class="gauge-fill"
                cx="100"
                cy="100"
                r="80"
                stroke="${color}"
                stroke-dasharray="${circ}"
                stroke-dashoffset="${checklist.length ? offset : circ}"
              />
            </svg>
            <div class="gauge-text">
              <span class="gauge-value" style="color:${color};"
                >${checklist.length ? `${stats.pct}%` : '—'}</span
              ><span class="gauge-label">${checklist.length ? stats.label : 'No data'}</span>
            </div>
          </div>
          <p style="font-size:0.78rem;color:var(--text-muted);">
            Formula: (Compliant + ½·Partial) ÷ Applicable × 100
          </p>
        </div>
        <div class="card">
          <div class="card-header">
            <h3>${raw(icon('list-checks', 'icon'))} Status Breakdown</h3>
          </div>
          ${row('Compliant', stats.compliant, cssVar('--success'))}
          ${row('Partially Compliant', stats.partial, cssVar('--warning'))}
          ${row('Non-Compliant', stats.nonComp, cssVar('--danger'))}
          ${row('Pending', stats.pending, cssVar('--text-muted'))}
          ${row('Not Applicable', stats.na, cssVar('--info'))}
          <div
            style="margin-top:16px;padding:14px;background:var(--bg-sunken);border-radius:var(--r-md);text-align:center;font-size:0.84rem;"
          >
            Audit opinion:
            <strong style="color:${color};">${checklist.length ? stats.opinion : 'Pending'}</strong>
          </div>
        </div>
      </div>
    `;
  },
};
