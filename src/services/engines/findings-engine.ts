/**
 * Findings & checklist generation — pure derivations from risks, threats and
 * checklist state.
 */
import type { AssetThreatMap, ChecklistItem, Finding, Risk } from '@/core/types';
import { findVulnerability } from '@/data/vulnerabilities';
import { getFramework } from '@/data/frameworks';

const BASELINE_CONTROLS = [
  'Verify an incident response plan exists and is tested annually.',
  'Verify data backup procedures are documented and tested.',
  'Verify security awareness training is provided to all staff.',
  'Verify access control policies are defined and enforced.',
  'Verify a change management process governs system updates.',
];

/** Generate an audit checklist from the asset→vulnerability map plus baselines. */
export function generateChecklist(threats: AssetThreatMap): ChecklistItem[] {
  const checklist: ChecklistItem[] = [];
  const seen = new Set<string>();
  for (const ids of Object.values(threats)) {
    for (const id of ids) {
      const v = findVulnerability(id);
      if (!v || seen.has(v.id)) continue;
      seen.add(v.id);
      checklist.push({
        title: v.auditChecklistItem,
        description: `${v.name} (${v.category}) — ${getFramework(v.category).iso}`,
        source: v.name,
        status: 'pending',
        notes: '',
      });
    }
  }
  for (const title of BASELINE_CONTROLS) {
    if (!checklist.some((c) => c.title === title)) {
      checklist.push({
        title,
        description: 'OCTAVE Allegro baseline control',
        source: 'OCTAVE Allegro',
        status: 'pending',
        notes: '',
      });
    }
  }
  return checklist;
}

/** Generate findings from high-severity risks and non-compliant controls. */
export function generateFindings(risks: Risk[], checklist: ChecklistItem[]): Finding[] {
  const findings: Finding[] = [];
  for (const r of risks.filter((x) => x.score >= 10)) {
    findings.push({
      issue: `${r.threat} on ${r.asset}`,
      risk: r.impactDesc,
      asset: r.asset,
      recommendation: r.mitigation,
      riskScore: r.score,
    });
  }
  for (const c of checklist.filter((x) => x.status === 'non-compliant')) {
    findings.push({
      issue: c.title,
      risk: 'Control not implemented — potential security gap.',
      asset: c.source || 'General',
      recommendation: 'Implement the required control and provide evidence of compliance.',
      riskScore: 12,
    });
  }
  return findings;
}
