/** User manual feature. */
import { html, raw, type RawHtml } from '@/ui/html';
import { icon } from '@/ui/icons';
import type { Feature } from '../feature';

const STEPS: [string, string][] = [
  [
    'Define Risk Measurement Criteria',
    'Set impact areas (Reputation, Financial, Productivity, Safety, Legal) and the thresholds for Low/Medium/High impact.',
  ],
  [
    'Develop Information Asset Profiles',
    'Register critical assets with owners, descriptions and CIA (Confidentiality, Integrity, Availability) values.',
  ],
  [
    'Identify Asset Containers',
    'Map where each asset lives — Technical, Physical, and People containers.',
  ],
  [
    'Identify Areas of Concern',
    'Select applicable OWASP vulnerabilities per asset to surface threat vectors.',
  ],
  [
    'Identify Threat Scenarios',
    'Threat scenarios are generated from your vulnerability selections.',
  ],
  [
    'Identify Risks',
    'Run the assessment to compute Risk = Likelihood × Impact for every threat–asset pair.',
  ],
  ['Analyze Risks', 'Review the 5×5 heatmap and register; prioritise Critical and High risks.'],
  [
    'Select Mitigation Approach',
    'Document controls in the audit checklist and use the AI assistant for tailored guidance.',
  ],
];

const MODULES: [string, string][] = [
  [
    'User Management',
    'Manage workspace users and role-based access — Admin (full), Auditor (audit functions), Auditee (view + evidence).',
  ],
  [
    'Organization Profile',
    'Define the organization; the platform computes an inherent exposure score (1–10).',
  ],
  ['Asset Inventory', 'Register assets with CIA values and map containers (OCTAVE Steps 2 & 3).'],
  [
    'Threats & Vulnerabilities',
    'Map OWASP vulnerabilities to assets, cross-referenced to ISO 27001 and NIST CSF.',
  ],
  ['Risk Assessment', 'The OCTAVE engine — heatmap, register, and the 8-step wizard.'],
  ['Audit Checklist', 'Generate controls from threats and record compliance status with notes.'],
  ['Evidence Collection', 'Upload real evidence files, stored in cloud or locally.'],
  ['Compliance Scoring', 'Live compliance gauge and breakdown computed from your checklist.'],
  ['Audit Findings', 'Auto-generate findings from high risks and non-compliant controls.'],
  ['AI Assistant', 'Live AI with your API key, or the built-in OWASP/OCTAVE knowledge base.'],
  ['Report Generator', 'Export a comprehensive PDF audit report with a final opinion.'],
];

export const docsFeature: Feature = {
  render(): RawHtml {
    return html`
      <div class="page-header fade-up">
        <h1>User Manual</h1>
        <p>Guide to the SRMAudit 2026 OCTAVE Allegro GRC platform</p>
      </div>
      <div class="card fade-up">
        <div class="card-header">
          <h3>${raw(icon('layers', 'icon'))} OCTAVE Allegro Workflow</h3>
        </div>
        ${STEPS.map(
          (s, i) =>
            html`<div class="docs-step">
              <div class="docs-step-num">${i + 1}</div>
              <div class="docs-step-content">
                <h4>${s[0]}</h4>
                <p>${s[1]}</p>
              </div>
            </div>`,
        )}
      </div>
      <div class="card fade-up">
        <div class="card-header"><h3>${raw(icon('book-open', 'icon'))} Module Guide</h3></div>
        ${MODULES.map(
          (m, i) =>
            html`<div class="docs-section">
              <h3>Module ${i + 1} — ${m[0]}</h3>
              <p>${m[1]}</p>
            </div>`,
        )}
      </div>
      <div class="card fade-up">
        <div class="card-header"><h3>${raw(icon('info', 'icon'))} Tips</h3></div>
        <div class="docs-section">
          <ul>
            <li>
              <strong>Example data:</strong> load a complete worked scenario from the Dashboard to
              explore every module.
            </li>
            <li>
              <strong>Storage:</strong> data is real and persistent — Supabase cloud when
              configured, otherwise IndexedDB in this browser.
            </li>
            <li>
              <strong>AI:</strong> works from the knowledge base offline; add a key in Settings for
              generative answers.
            </li>
            <li>
              <strong>Reports:</strong> complete Steps 1–6 before generating for the most complete
              report.
            </li>
          </ul>
        </div>
      </div>
    `;
  },
};
