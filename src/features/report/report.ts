/** Report generator feature (OCTAVE module 11). */
import { html, raw, type RawHtml } from '@/ui/html';
import { icon } from '@/ui/icons';
import { button } from '@/ui/components';
import { cssVar } from '@/ui/chart';
import { onAction } from '@/ui/dom';
import { getComplianceStats } from '@/services/engines/compliance-engine';
import { getRiskLevel } from '@/data/risk-levels';
import { generateReport, type ReportSection } from '@/services/pdf-service';
import { hasLiveAi, callAi } from '@/services/ai-service';
import { logActivity } from '@/services/activity-log';
import type { Feature } from '../feature';
import { repo, toast } from '../helpers';

const SECTIONS: [ReportSection, string, boolean][] = [
  ['summary', 'Executive Summary', true],
  ['scope', 'Scope & Assets', true],
  ['methodology', 'OCTAVE Methodology', true],
  ['risk', 'Detailed Risk Profile', true],
  ['compliance', 'Compliance & Controls', true],
  ['findings', 'Audit Findings', true],
  ['recommendations', 'Recommendations', true],
  ['evidence', 'Evidence Register', false],
];
let registered = false;

function register(): void {
  if (registered) return;
  registered = true;

  onAction('report:summary', async (el) => {
    const r = repo();
    const org = r.get('organization');
    const assets = r.get('assets');
    const risks = r.get('risks');
    const checklist = r.get('auditChecklist');
    const stats = getComplianceStats(checklist);
    const area = document.getElementById('execSummary') as HTMLTextAreaElement;

    if (!hasLiveAi()) {
      const crit = risks.filter((x) => getRiskLevel(x.score).label === 'Critical').length;
      const high = risks.filter((x) => getRiskLevel(x.score).label === 'High').length;
      const top = [...risks]
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((x) => x.threat);
      area.value = `This security audit of ${org.name || 'the organization'}${org.sector ? ` (${org.sector} sector)` : ''} was conducted using the OCTAVE Allegro risk assessment methodology. The assessment covered ${assets.length} information asset${assets.length === 1 ? '' : 's'} and evaluated ${checklist.length} security control${checklist.length === 1 ? '' : 's'}.\n\nThe assessment identified ${risks.length} risk${risks.length === 1 ? '' : 's'}, of which ${crit} are Critical and ${high} are High severity${top.length ? `. The principal areas of concern are ${top.join(', ')}` : ''}. Overall control compliance stands at ${stats.pct}%, yielding an audit opinion of "${stats.opinion}".\n\nManagement is advised to prioritise remediation of Critical and High risks, address non-compliant controls, and schedule a follow-up review within 90 days to verify remediation progress.`;
      toast('Summary drafted from your audit data');
      return;
    }

    const btn = el as HTMLButtonElement;
    btn.disabled = true;
    const prev = btn.innerHTML;
    btn.innerHTML = `${icon('refresh', 'icon spin')} Generating…`;
    const prompt = `Write a concise (150-200 word) professional Executive Summary for an OCTAVE Allegro security audit.\nOrganization: ${org.name || 'N/A'} (${org.sector || 'N/A'})\nScope: ${assets.length} assets, ${checklist.length} controls.\nRisks: ${risks.length}; principal risks ${risks
      .slice(0, 3)
      .map((x) => x.threat)
      .join(
        ', ',
      )}.\nCompliance: ${stats.pct}% (${stats.opinion}).\nHighlight strengths, critical weaknesses, and a management recommendation.`;
    try {
      area.value = await callAi(prompt, '', 600);
      toast('AI summary generated');
    } catch (e) {
      toast('AI request failed: ' + (e as Error).message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = prev;
    }
  });

  onAction('report:generate', () => {
    const r = repo();
    const sections = new Set<ReportSection>();
    for (const [id] of SECTIONS) {
      const cb = document.getElementById(`sect_${id}`) as HTMLInputElement | null;
      if (cb?.checked) sections.add(id);
    }
    generateReport({
      data: {
        organization: r.get('organization'),
        assets: r.get('assets'),
        risks: r.get('risks'),
        auditChecklist: r.get('auditChecklist'),
        findings: r.get('findings'),
        evidence: r.get('evidence'),
      },
      sections,
      executiveSummary:
        (document.getElementById('execSummary') as HTMLTextAreaElement)?.value ?? '',
    });
    logActivity(
      'Report Generated',
      `PDF for ${r.get('organization').name || 'Organization'}`,
      'accent',
    );
    toast('PDF report downloaded');
  });
}

export const reportFeature: Feature = {
  render(): RawHtml {
    register();
    const r = repo();
    const checklist = r.get('auditChecklist');
    const risks = r.get('risks');
    const stats = getComplianceStats(checklist);
    const color =
      stats.pct >= 85
        ? cssVar('--success')
        : stats.pct >= 60
          ? cssVar('--warning')
          : cssVar('--danger');
    const opinionIcon =
      stats.pct >= 85 ? 'shield-check' : stats.pct >= 60 ? 'shield-alert' : 'alert-triangle';
    return html`
      <div class="page-header fade-up">
        <h1>Report Generator</h1>
        <p>Produce a comprehensive OCTAVE Allegro security audit report</p>
      </div>
      <div class="grid-2 stagger">
        <div class="card">
          <div class="card-header">
            <h3>${raw(icon('file-text', 'icon'))} Executive Summary</h3>
            ${button({
              label: 'Generate',
              icon: 'sparkles',
              action: 'report:summary',
              size: 'sm',
              attrs: 'id="genSummaryBtn"',
            })}
          </div>
          <textarea
            id="execSummary"
            class="form-control"
            style="height:240px;font-size:0.85rem;line-height:1.6;"
            placeholder="Click Generate to draft a professional summary from your audit data, then review and edit before export."
          ></textarea>
        </div>
        <div class="card">
          <div class="card-header">
            <h3>${raw(icon('list-checks', 'icon'))} Report Sections</h3>
          </div>
          <div>
            ${SECTIONS.map(
              ([id, label, on]) =>
                html`<label class="check-row"
                  ><input type="checkbox" id="sect_${id}" ${on ? raw('checked') : ''} /><span
                    >${label}</span
                  ></label
                >`,
            )}
          </div>
          ${button({
            label: 'Generate PDF Report',
            icon: 'printer',
            action: 'report:generate',
            variant: 'primary',
            block: true,
            attrs: 'style="margin-top:16px;"',
          })}
        </div>
      </div>
      <div class="card fade-up">
        <div class="card-header"><h3>${raw(icon('gauge', 'icon'))} Final Audit Snapshot</h3></div>
        <div class="grid-2">
          <div class="text-center">
            <div
              style="width:56px;height:56px;margin:0 auto 10px;border-radius:var(--r-lg);display:flex;align-items:center;justify-content:center;background:${color}22;color:${color};"
            >
              ${raw(icon(opinionIcon, 'icon-lg'))}
            </div>
            <div
              style="font-family:var(--font-display);font-size:1.3rem;font-weight:800;color:${color};"
            >
              ${checklist.length ? stats.opinion : 'Pending'}
            </div>
            <p style="font-size:0.8rem;">
              Based on ${checklist.length ? `${stats.pct}% compliance` : 'no audit data yet'}
            </p>
          </div>
          <div>
            <p style="font-size:0.85rem;margin-bottom:12px;">
              The report will cover ${stats.applicable} applicable controls and mitigation
              strategies for ${risks.filter((x) => x.score >= 10).length} high-priority risks.
            </p>
            <div class="progress-track">
              <div class="progress-fill" style="width:${checklist.length ? stats.pct : 0}%;"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  },
};
