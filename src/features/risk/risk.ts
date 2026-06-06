/** Risk assessment feature (OCTAVE module 5) — wizard, heatmap, register. */
import type { Risk } from '@/core/types';
import { html, raw, type RawHtml } from '@/ui/html';
import { icon } from '@/ui/icons';
import { button, emptyState } from '@/ui/components';
import { onAction } from '@/ui/dom';
import { openModal, closeModal } from '@/ui/modal';
import { buildRiskRegister } from '@/services/engines/risk-engine';
import { getRiskLevel } from '@/data/risk-levels';
import { IMPACT_AREAS } from '@/data/octave-reference';
import { logActivity } from '@/services/activity-log';
import type { Feature } from '../feature';
import { repo, toast, navigate } from '../helpers';

const WIZARD = [
  'Risk Criteria',
  'Asset Profiles',
  'Containers',
  'Areas of Concern',
  'Threat Scenarios',
  'Identify Risks',
  'Analyze Risks',
  'Mitigations',
];
let registered = false;
let activeFilter: string | null = null;

function runAssessment(): void {
  const threats = repo().get('assetThreats');
  if (Object.keys(threats).length === 0) return toast('Identify threats first (Module 4)', 'error');
  const risks = buildRiskRegister(threats);
  repo().set('risks', risks);
  logActivity('Risk Assessment', `${risks.length} risks computed`, 'high');
  toast(`${risks.length} risks assessed`);
  navigate('risk');
}

function register(): void {
  if (registered) return;
  registered = true;

  onAction('risk:run', () => runAssessment());

  onAction('risk:step', (el) => {
    const step = Number(el.dataset.step);
    openStep(step);
  });

  onAction('risk:saveCriteria', () => {
    const criteria: Record<string, { low: string; med: string; high: string }> = {};
    for (const ia of IMPACT_AREAS) {
      criteria[ia.id] = {
        low: (document.getElementById(`crit_${ia.id}_low`) as HTMLInputElement).value,
        med: (document.getElementById(`crit_${ia.id}_med`) as HTMLInputElement).value,
        high: (document.getElementById(`crit_${ia.id}_high`) as HTMLInputElement).value,
      };
    }
    repo().set('riskCriteria', criteria);
    logActivity('Risk Criteria', 'Measurement criteria defined', 'accent');
    closeModal();
    toast('Risk criteria saved');
  });

  onAction('risk:filter', (el) => {
    const key = el.dataset.profile ?? '';
    const cards = document.querySelectorAll<HTMLElement>('#riskRegister .finding-card');
    if (activeFilter === key) {
      cards.forEach((c) => (c.style.display = ''));
      activeFilter = null;
      toast('Showing all risks');
    } else {
      let n = 0;
      cards.forEach((c) => {
        const match = c.dataset.profile === key;
        c.style.display = match ? '' : 'none';
        if (match) n++;
      });
      activeFilter = key;
      const [l, i] = key.split('-');
      toast(`${n} risk(s) at L${l} / I${i}`);
    }
  });
}

function openStep(step: number): void {
  const go = (page: string, label: string) =>
    button({ label, action: `nav:${page}`, variant: 'primary' });
  if (step === 1) {
    const criteria = repo().get('riskCriteria');
    openModal({
      title: 'Step 1 — Establish Risk Measurement Criteria',
      large: true,
      body: html`
        <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:14px;">
          Define impact thresholds for each area.
        </p>
        ${IMPACT_AREAS.map((ia) => {
          const c = criteria[ia.id] ?? {
            low: 'Minimal disruption',
            med: 'Moderate disruption',
            high: 'Severe disruption',
          };
          return html`<div
            style="margin-bottom:14px;padding:12px;border:1px solid var(--border);border-radius:var(--r-md);"
          >
            <h4 style="font-size:0.88rem;margin-bottom:3px;">${ia.name}</h4>
            <p style="font-size:0.76rem;color:var(--text-muted);margin-bottom:8px;">
              ${ia.description}
            </p>
            <div class="grid-3">
              <div class="form-group">
                <label>Low</label
                ><input class="form-control" id="crit_${ia.id}_low" value="${c.low}" />
              </div>
              <div class="form-group">
                <label>Medium</label
                ><input class="form-control" id="crit_${ia.id}_med" value="${c.med}" />
              </div>
              <div class="form-group">
                <label>High</label
                ><input class="form-control" id="crit_${ia.id}_high" value="${c.high}" />
              </div>
            </div>
          </div>`;
        })}
      `,
      footer: button({
        label: 'Save Criteria',
        icon: 'save',
        action: 'risk:saveCriteria',
        variant: 'primary',
      }),
    });
    return;
  }
  const steps: Record<number, { title: string; body: RawHtml; footer: RawHtml }> = {
    2: {
      title: 'Step 2 — Develop Asset Profile',
      body: html`<p>Asset profiles are managed in Module 3 — Asset Inventory.</p>`,
      footer: go('assets', 'Go to Asset Inventory'),
    },
    3: {
      title: 'Step 3 — Identify Containers',
      body: html`<p>
        Containers are managed per asset in Module 3 — use the Containers action on any asset.
      </p>`,
      footer: go('assets', 'Go to Asset Inventory'),
    },
    4: {
      title: 'Step 4 — Areas of Concern',
      body: html`<p>Areas of concern come from your vulnerability selection in Module 4.</p>`,
      footer: go('threats', 'Go to Threats'),
    },
    5: {
      title: 'Step 5 — Threat Scenarios',
      body: html`<p>
        Threat scenarios are generated automatically from selected OWASP vulnerabilities.
      </p>`,
      footer: go('threats', 'Go to Threats'),
    },
    6: {
      title: 'Step 6 — Identify Risks',
      body: html`<p>Run the full assessment to compute risks from your threat data.</p>`,
      footer: button({
        label: 'Run Assessment',
        icon: 'play',
        action: 'risk:run',
        variant: 'primary',
      }),
    },
    7: {
      title: 'Step 7 — Analyze Risks',
      body: html`<p>
        Risks are scored as Likelihood × Impact and visualised in the 5×5 heatmap and register.
      </p>`,
      footer: html``,
    },
    8: {
      title: 'Step 8 — Select Mitigation Approach',
      body: html`<p>
        Each vulnerability carries a recommended mitigation. Use the AI assistant for tailored
        guidance and record controls in the audit checklist.
      </p>`,
      footer: go('ai', 'Go to AI Assistant'),
    },
  };
  const s = steps[step];
  if (s) openModal({ title: s.title, large: true, body: s.body, footer: s.footer });
}

function heatmap(risks: Risk[]): RawHtml {
  const map = new Map<string, number>();
  for (const r of risks) {
    const k = `${r.likelihood}-${r.impact}`;
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  const cells: RawHtml[] = [];
  for (const l of [5, 4, 3, 2, 1]) {
    cells.push(html`<div class="hm-axis">${l}</div>`);
    for (const im of [1, 2, 3, 4, 5]) {
      const sc = l * im;
      const lv = getRiskLevel(sc);
      const count = map.get(`${l}-${im}`) ?? 0;
      cells.push(
        html`<div
          class="hm-cell ${lv.label.toLowerCase()} ${count ? '' : 'empty'}"
          data-tooltip="${count} risk(s) · ${lv.label} · score ${sc}"
          ${count
            ? raw(`data-action="risk:filter" data-profile="${l}-${im}" style="cursor:pointer;"`)
            : ''}
        >
          ${count || ''}
        </div>`,
      );
    }
  }
  cells.push(html`<div class="hm-axis"></div>`);
  for (const i of [1, 2, 3, 4, 5]) cells.push(html`<div class="hm-axis">${i}</div>`);
  return html`<div class="heatmap-wrap">
    <div class="heatmap-y-label">Likelihood</div>
    <div class="heatmap-main">
      <div class="heatmap-grid">${cells}</div>
      <div class="heatmap-x-label">Impact</div>
    </div>
  </div>`;
}

export const riskFeature: Feature = {
  render(): RawHtml {
    register();
    const risks = repo().get('risks');
    return html`
      <div class="page-header fade-up">
        <h1>Risk Assessment Engine</h1>
        <p>OCTAVE Allegro Steps 1, 6, 7, 8 — quantify Risk = Likelihood × Impact</p>
      </div>
      <div class="card fade-up">
        <div class="card-header">
          <h3>${raw(icon('gauge', 'icon'))} OCTAVE Allegro 8-Step Wizard</h3>
          ${button({
            label: 'Run Full Assessment',
            icon: 'play',
            action: 'risk:run',
            variant: 'primary',
            size: 'sm',
          })}
        </div>
        <div class="wizard-steps">
          ${WIZARD.map(
            (s, i) =>
              html`<div class="wizard-step" data-action="risk:step" data-step="${i + 1}">
                <span class="step-num">${i + 1}</span> ${s}
              </div>`,
          )}
        </div>
      </div>
      <div class="grid-2 stagger">
        <div class="card">
          <div class="card-header"><h3>${raw(icon('target', 'icon'))} Risk Matrix Heatmap</h3></div>
          ${heatmap(risks)}
        </div>
        <div class="card">
          <div class="card-header">
            <h3>${raw(icon('list-checks', 'icon'))} Risk Register (${risks.length})</h3>
          </div>
          ${risks.length === 0
            ? emptyState({
                icon: 'crosshair',
                title: 'Empty register',
                message: 'Run the assessment wizard to populate risks.',
              })
            : html`<div id="riskRegister" style="max-height:360px;overflow-y:auto;">
                ${risks.map((r) => {
                  const lv = getRiskLevel(r.score);
                  return html`<div
                    class="finding-card ${lv.label.toLowerCase()}"
                    data-profile="${r.likelihood}-${r.impact}"
                  >
                    <div class="finding-header">
                      <span class="finding-title" style="font-size:0.85rem;">${r.threat}</span
                      ><span class="badge badge-${lv.label.toLowerCase()}"
                        >${r.score} ${lv.label}</span
                      >
                    </div>
                    <div class="finding-body" style="font-size:0.78rem;">
                      <strong>Asset:</strong> ${r.asset} · ${r.impactDesc}
                    </div>
                  </div>`;
                })}
              </div>`}
        </div>
      </div>
    `;
  },
};
