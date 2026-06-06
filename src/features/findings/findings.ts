/** Audit findings feature (OCTAVE module 9). */
import { html, raw, type RawHtml } from '@/ui/html';
import { icon } from '@/ui/icons';
import { button, emptyState } from '@/ui/components';
import { onAction } from '@/ui/dom';
import { generateFindings } from '@/services/engines/findings-engine';
import { getRiskLevel, riskClass } from '@/data/risk-levels';
import { logActivity } from '@/services/activity-log';
import type { Feature } from '../feature';
import { repo, toast, navigate } from '../helpers';

let registered = false;

function register(): void {
  if (registered) return;
  registered = true;
  onAction('findings:generate', () => {
    const findings = generateFindings(repo().get('risks'), repo().get('auditChecklist'));
    repo().set('findings', findings);
    logActivity('Findings Generated', `${findings.length} findings`, 'danger');
    toast(`${findings.length} findings generated`);
    navigate('findings');
  });
}

export const findingsFeature: Feature = {
  render(): RawHtml {
    register();
    const findings = repo().get('findings');
    return html`
      <div class="page-header fade-up">
        <h1>Audit Findings</h1>
        <p>Findings generated from high risks and non-compliant controls</p>
      </div>
      <div class="card fade-up">
        <div class="card-header">
          <h3>${raw(icon('alert-triangle', 'icon'))} Findings (${findings.length})</h3>
          ${button({
            label: 'Auto-Generate',
            icon: 'zap',
            action: 'findings:generate',
            variant: 'primary',
            size: 'sm',
          })}
        </div>
        ${findings.length === 0
          ? emptyState({
              icon: 'check-circle',
              title: 'No findings',
              message: 'Generate findings from your audit results and risk register.',
            })
          : html`${findings.map(
              (f) =>
                html`<div class="finding-card ${riskClass(f.riskScore)}">
                  <div class="finding-header">
                    <span class="finding-title">${f.issue}</span
                    ><span class="badge badge-${riskClass(f.riskScore)}"
                      >${getRiskLevel(f.riskScore).label}</span
                    >
                  </div>
                  <div class="finding-body">
                    <p><strong>Risk:</strong> ${f.risk}</p>
                    <p><strong>Affected asset:</strong> ${f.asset}</p>
                    <p><strong>Recommendation:</strong> ${f.recommendation}</p>
                  </div>
                </div>`,
            )}`}
      </div>
    `;
  },
};
