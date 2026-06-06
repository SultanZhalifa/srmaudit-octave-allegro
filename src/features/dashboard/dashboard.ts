/** Dashboard feature — KPI overview, charts, readiness, recent activity. */
import type { ChecklistItem, Risk } from '@/core/types';
import { html, raw, type RawHtml } from '@/ui/html';
import { icon } from '@/ui/icons';
import { statCard, emptyState, button } from '@/ui/components';
import { getComplianceStats } from '@/services/engines/compliance-engine';
import { getRiskLevel, riskClass } from '@/data/risk-levels';
import type { Feature } from '../feature';
import { repo } from '../helpers';
import { renderReadiness } from './readiness';
import { renderOctaveSteps, renderActivityFeed } from './widgets';
import { drawDashboardCharts } from './charts';

export const dashboardFeature: Feature = {
  render(): RawHtml {
    const r = repo();
    const org = r.get('organization');
    const assets = r.get('assets');
    const risks = r.get('risks');
    const checklist = r.get('auditChecklist');
    const findings = r.get('findings');
    const evidence = r.get('evidence');
    const stats = getComplianceStats(checklist);
    const crit = risks.filter((x) => getRiskLevel(x.score).label === 'Critical').length;
    const high = risks.filter((x) => getRiskLevel(x.score).label === 'High').length;
    const hasData = assets.length > 0;

    return html`
      <div class="page-header fade-up">
        <h1>Dashboard</h1>
        <p>OCTAVE Allegro risk overview${org.name ? ` — ${org.name}` : ''}</p>
        <div class="header-actions btn-group">
          ${button({ label: 'Export', icon: 'download', action: 'data:export', size: 'sm' })}
          ${button({ label: 'Import', icon: 'upload', action: 'data:import', size: 'sm' })}
        </div>
      </div>

      ${hasData
        ? renderReadiness(r)
        : html`<div class="banner fade-up">
            ${raw(icon('rocket', 'icon'))}
            <div class="banner-text">
              <strong>Get started</strong>
              <p>
                Register your organization and assets, or load a worked example to explore every
                module.
              </p>
            </div>
            ${button({
              label: 'Load Example',
              icon: 'database',
              action: 'data:example',
              variant: 'primary',
              size: 'sm',
            })}
          </div>`}

      <div class="stats-grid stagger">
        ${statCard({ icon: 'boxes', value: assets.length, label: 'Information Assets' })}
        ${statCard({ icon: 'crosshair', value: risks.length, label: 'Identified Risks' })}
        ${statCard({ icon: 'flame', value: crit + high, label: 'Critical / High Risks' })}
        ${statCard({
          icon: 'shield-check',
          value: checklist.length ? stats.pct : 0,
          label: 'Compliance Score',
          suffix: checklist.length ? '%' : '',
        })}
        ${statCard({ icon: 'paperclip', value: evidence.length, label: 'Evidence Items' })}
        ${statCard({ icon: 'alert-triangle', value: findings.length, label: 'Audit Findings' })}
      </div>

      <div class="grid-2 stagger">
        <div class="card">
          <div class="card-header"><h3>${raw(icon('target', 'icon'))} Risk Distribution</h3></div>
          ${risks.length
            ? html`<div class="chart-container"><canvas id="riskPie"></canvas></div>`
            : emptyState({
                icon: 'target',
                title: 'No risks yet',
                message: 'Complete Modules 4 & 5 to populate your risk profile.',
              })}
        </div>
        <div class="card">
          <div class="card-header">
            <h3>${raw(icon('bar-chart', 'icon'))} Compliance Breakdown</h3>
          </div>
          ${checklist.length
            ? html`<div class="chart-container"><canvas id="compBar"></canvas></div>`
            : emptyState({
                icon: 'clipboard-check',
                title: 'No audit data',
                message: 'Generate an audit checklist in Module 6.',
              })}
        </div>
      </div>

      <div class="grid-2 stagger">
        <div class="card">
          <div class="card-header">
            <h3>${raw(icon('layers', 'icon'))} OCTAVE Allegro Progress</h3>
          </div>
          <div class="stepper-v">${renderOctaveSteps(r)}</div>
        </div>
        <div class="card">
          <div class="card-header"><h3>${raw(icon('activity', 'icon'))} Recent Activity</h3></div>
          ${renderActivityFeed(r)}
        </div>
      </div>

      <div class="card fade-up">
        <div class="card-header">
          <h3>${raw(icon('alert-triangle', 'icon'))} Priority Findings</h3>
          ${findings.length
            ? html`<button class="btn btn-ghost btn-sm" data-action="nav:findings">
                View all ${raw(icon('arrow-right', 'icon'))}
              </button>`
            : ''}
        </div>
        ${findings.length === 0
          ? emptyState({
              icon: 'check-circle',
              title: 'No findings',
              message: 'Run the audit workflow to surface security gaps.',
            })
          : html`${findings.slice(0, 5).map((f) => renderFindingCard(f))}`}
      </div>
    `;
  },

  onMount(): void {
    const r = repo();
    drawDashboardCharts(r.get('risks'), r.get('auditChecklist'));
  },
};

function renderFindingCard(f: {
  issue: string;
  asset: string;
  recommendation: string;
  riskScore: number;
}): RawHtml {
  return html`
    <div class="finding-card ${riskClass(f.riskScore)}">
      <div class="finding-header">
        <span class="finding-title">${f.issue}</span>
        <span class="badge badge-${riskClass(f.riskScore)}"
          >${getRiskLevel(f.riskScore).label}</span
        >
      </div>
      <div class="finding-body">
        <strong>Asset:</strong> ${f.asset} &middot; <strong>Action:</strong> ${f.recommendation}
      </div>
    </div>
  `;
}

export type { Risk, ChecklistItem };
