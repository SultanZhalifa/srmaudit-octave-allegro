/**
 * PDF report service — renders a comprehensive OCTAVE Allegro audit report from
 * the workspace data using jsPDF. Section inclusion is controlled by a flag set.
 */
import { jsPDF } from 'jspdf';
import type { WorkspaceData } from '@/core/types';
import { getRiskLevel } from '@/data/risk-levels';
import { getFramework } from '@/data/frameworks';
import { getComplianceStats } from './engines/compliance-engine';

export type ReportSection =
  | 'summary'
  | 'scope'
  | 'methodology'
  | 'risk'
  | 'compliance'
  | 'findings'
  | 'recommendations'
  | 'evidence';

export interface ReportInput {
  data: Pick<
    WorkspaceData,
    'organization' | 'assets' | 'risks' | 'auditChecklist' | 'findings' | 'evidence'
  >;
  sections: Set<ReportSection>;
  executiveSummary: string;
}

export function generateReport(input: ReportInput): void {
  const { data, sections, executiveSummary } = input;
  const { organization: org, assets, risks, auditChecklist: checklist, findings } = data;
  const stats = getComplianceStats(checklist);
  const doc = new jsPDF();
  let y = 20;

  const has = (s: ReportSection) => sections.has(s);
  const title = (t: string) => {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(t, 105, y, { align: 'center' });
    y += 9;
  };
  const heading = (t: string) => {
    if (y > 262) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(166, 79, 32);
    doc.text(t, 14, y);
    doc.setTextColor(40, 33, 25);
    y += 7;
  };
  const text = (t: string) => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    for (const line of doc.splitTextToSize(t, 182)) {
      if (y > 278) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 14, y);
      y += 5;
    }
    y += 2;
  };
  const rule = () => {
    doc.setDrawColor(220, 210, 195);
    doc.line(14, y, 196, y);
    y += 6;
  };

  title('SECURITY AUDIT REPORT');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 33, 25);
  doc.text(org.name || 'Organization', 105, y, { align: 'center' });
  y += 5;
  doc.text('Framework: OCTAVE Allegro', 105, y, { align: 'center' });
  y += 5;
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 105, y, { align: 'center' });
  y += 10;
  rule();

  if (has('summary')) {
    heading('1. Executive Summary');
    text(
      executiveSummary ||
        `This OCTAVE Allegro audit of ${org.name || 'the organization'} identified ${risks.length} risks across ${assets.length} assets. Overall compliance is ${stats.pct}%, with an audit opinion of "${stats.opinion}".`,
    );
    rule();
  }
  if (has('scope')) {
    heading('2. Scope & Assets');
    text(
      `Organization: ${org.name || 'N/A'} | Sector: ${org.sector || 'N/A'} | System: ${org.system || 'N/A'} | Employees: ${org.employees || 'N/A'}`,
    );
    text(
      `This audit covers ${assets.length} information assets and ${checklist.length} security controls.`,
    );
    for (const a of assets) {
      text(
        `- ${a.name} — Owner: ${a.owner} | Type: ${a.type} | CIA: ${a.confidentiality}/${a.integrity}/${a.availability}`,
      );
    }
    rule();
  }
  if (has('methodology')) {
    heading('3. OCTAVE Allegro Methodology');
    text(
      'This audit follows the 8-step OCTAVE Allegro method: (1) Establish Risk Measurement Criteria, (2) Develop Asset Profile, (3) Identify Containers, (4) Identify Areas of Concern, (5) Identify Threat Scenarios, (6) Identify Risks, (7) Analyze Risks, (8) Select Mitigation Approach.',
    );
    rule();
  }
  if (has('risk')) {
    heading('4. Detailed Risk Profile');
    const count = (label: string) =>
      risks.filter((r) => getRiskLevel(r.score).label === label).length;
    text(
      `Total: ${risks.length} | Critical: ${count('Critical')} | High: ${count('High')} | Medium: ${count('Medium')} | Low: ${count('Low')}`,
    );
    for (const r of [...risks].sort((a, b) => b.score - a.score).slice(0, 24)) {
      text(
        `- [${getRiskLevel(r.score).label}] ${r.threat} on ${r.asset} — score ${r.score}/25 (${getFramework(r.category).iso})`,
      );
    }
    rule();
  }
  if (has('compliance')) {
    heading('5. Compliance & Controls');
    text(`Overall compliance: ${stats.pct}% — ${stats.label}`);
    text(
      `Compliant: ${stats.compliant} | Partial: ${stats.partial} | Non-Compliant: ${stats.nonComp} | Pending: ${stats.pending} | N/A: ${stats.na} | Total: ${checklist.length}`,
    );
    rule();
  }
  if (has('findings')) {
    heading('6. Audit Findings');
    findings.forEach((f, i) => {
      text(`Finding ${i + 1}: ${f.issue}`);
      text(`  Risk: ${f.risk}`);
      text(`  Recommendation: ${f.recommendation}`);
    });
    if (findings.length === 0) text('No findings generated.');
    rule();
  }
  if (has('recommendations')) {
    heading('7. Recommendations');
    [
      'Prioritise remediation of Critical and High risks per the Step 8 mitigation approach.',
      'Remediate non-compliant and partially compliant controls to improve posture.',
      'Ensure every critical asset has verified evidence linked for future re-audits.',
      'Review the risk register quarterly to adapt to emerging threats.',
    ].forEach((r, i) => text(`${i + 1}. ${r}`));
    rule();
  }
  if (has('evidence')) {
    heading('8. Evidence Register');
    for (const e of data.evidence) text(`- ${e.name} (${e.type || 'file'})`);
    if (data.evidence.length === 0) text('No evidence collected.');
    rule();
  }

  heading('Final Audit Opinion');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(stats.opinion, 105, y, { align: 'center' });
  y += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Based on ${stats.pct}% compliance and ${findings.length} findings.`, 105, y, {
    align: 'center',
  });
  y += 10;
  text(
    'Generated by SRMAudit 2026. Results reflect the data provided and the OCTAVE Allegro methodology applied.',
  );

  doc.save(
    `SRMAudit_Report_${(org.name || 'Report').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
  );
}
