import { describe, it, expect } from 'vitest';
import { generateChecklist, generateFindings } from '@/services/engines/findings-engine';
import { buildRiskRegister } from '@/services/engines/risk-engine';
import type { AssetThreatMap } from '@/core/types';

const threats: AssetThreatMap = { DB: ['VULN-001', 'VULN-016'] };

describe('generateChecklist', () => {
  it('creates one item per unique vulnerability plus baseline controls', () => {
    const list = generateChecklist(threats);
    // 2 vuln-derived + 5 baseline controls
    expect(list.length).toBe(7);
    expect(list.every((c) => c.status === 'pending')).toBe(true);
  });

  it('does not duplicate a vulnerability shared across assets', () => {
    const list = generateChecklist({ A: ['VULN-001'], B: ['VULN-001'] });
    const derived = list.filter((c) => c.source !== 'OCTAVE Allegro');
    expect(derived).toHaveLength(1);
  });
});

describe('generateFindings', () => {
  it('creates findings from high-severity risks (score >= 10)', () => {
    const risks = buildRiskRegister(threats); // both VULN-001(20) and VULN-016(16) are high+
    const findings = generateFindings(risks, []);
    expect(findings).toHaveLength(2);
    expect(findings[0]?.riskScore).toBeGreaterThanOrEqual(10);
  });

  it('creates a finding for each non-compliant control', () => {
    const findings = generateFindings(
      [],
      [
        { title: 'No MFA', description: '', source: 'Auth', status: 'non-compliant', notes: '' },
        { title: 'Has backups', description: '', source: 'Ops', status: 'compliant', notes: '' },
      ],
    );
    expect(findings).toHaveLength(1);
    expect(findings[0]?.issue).toBe('No MFA');
  });
});
