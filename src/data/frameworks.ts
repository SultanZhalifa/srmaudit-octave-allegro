/**
 * Cross-reference from OWASP vulnerability categories to real control
 * identifiers in ISO/IEC 27001:2022 Annex A and NIST CSF 2.0.
 */
import type { FrameworkRef, VulnerabilityCategory } from '@/core/types';

const FRAMEWORK_MAP: Record<VulnerabilityCategory, FrameworkRef> = {
  Injection: { iso: 'A.8.28, A.8.26', nist: 'PR.PS-06, PR.DS-02' },
  'Broken Authentication': { iso: 'A.5.17, A.8.5', nist: 'PR.AA-01, PR.AA-03' },
  'Sensitive Data Exposure': { iso: 'A.8.24, A.5.34', nist: 'PR.DS-01, PR.DS-02' },
  'Access Control Failures': { iso: 'A.8.3, A.5.15', nist: 'PR.AA-05, PR.AA-04' },
  'Security Misconfiguration': { iso: 'A.8.9, A.8.27', nist: 'PR.PS-01, ID.AM-08' },
  'Cross-Site Attacks': { iso: 'A.8.28, A.8.26', nist: 'PR.PS-06' },
  'Logging & Monitoring Failure': { iso: 'A.8.15, A.8.16', nist: 'DE.CM-01, DE.AE-03' },
  'Dependency & Software Issues': { iso: 'A.8.8, A.8.19', nist: 'ID.RA-01, PR.PS-02' },
};

export function getFramework(category: VulnerabilityCategory): FrameworkRef {
  return FRAMEWORK_MAP[category] ?? { iso: '—', nist: '—' };
}
