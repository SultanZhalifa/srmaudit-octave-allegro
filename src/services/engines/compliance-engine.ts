/**
 * Compliance engine — pure scoring from the audit checklist.
 * Score = (Compliant + ½·Partial) ÷ Applicable × 100.
 */
import type { ChecklistItem, ComplianceStats } from '@/core/types';

export function getComplianceStats(checklist: ChecklistItem[]): ComplianceStats {
  const compliant = checklist.filter((c) => c.status === 'compliant').length;
  const partial = checklist.filter((c) => c.status === 'partially').length;
  const nonComp = checklist.filter((c) => c.status === 'non-compliant').length;
  const pending = checklist.filter((c) => c.status === 'pending').length;
  const na = checklist.filter((c) => c.status === 'na').length;
  const applicable = checklist.filter((c) => c.status !== 'na' && c.status !== 'pending').length;
  const denom = applicable || 1;
  const pct = Math.round(((compliant + partial * 0.5) / denom) * 100);

  const label: ComplianceStats['label'] =
    pct >= 85 ? 'Compliant' : pct >= 60 ? 'Needs Improvement' : 'Non-Compliant';
  const opinion: ComplianceStats['opinion'] =
    pct >= 85 ? 'Secure' : pct >= 60 ? 'Acceptable Risk' : 'Needs Immediate Action';

  return { compliant, partial, nonComp, pending, na, applicable, pct, label, opinion };
}
