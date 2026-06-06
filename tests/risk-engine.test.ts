import { describe, it, expect } from 'vitest';
import {
  calcCriticality,
  buildRiskRegister,
  riskDistribution,
} from '@/services/engines/risk-engine';
import type { AssetThreatMap } from '@/core/types';

describe('calcCriticality', () => {
  it('rates all-High assets as Critical (score 9)', () => {
    const r = calcCriticality({ confidentiality: 'High', integrity: 'High', availability: 'High' });
    expect(r).toEqual({ level: 'Critical', score: 9 });
  });

  it('rates all-Low assets as Low (score 3)', () => {
    const r = calcCriticality({ confidentiality: 'Low', integrity: 'Low', availability: 'Low' });
    expect(r).toEqual({ level: 'Low', score: 3 });
  });

  it('rates mixed High/Medium as High at the boundary', () => {
    const r = calcCriticality({
      confidentiality: 'High',
      integrity: 'Medium',
      availability: 'Medium',
    });
    expect(r.score).toBe(7);
    expect(r.level).toBe('High');
  });

  it('maps score 4-5 to Medium', () => {
    const r = calcCriticality({ confidentiality: 'Medium', integrity: 'Low', availability: 'Low' });
    expect(r.score).toBe(4);
    expect(r.level).toBe('Medium');
  });
});

describe('buildRiskRegister', () => {
  it('produces one scored risk per known vulnerability', () => {
    const threats: AssetThreatMap = { 'Web App': ['VULN-001', 'VULN-016'] };
    const risks = buildRiskRegister(threats);
    expect(risks).toHaveLength(2);
    const sqli = risks.find((r) => r.vulnerability === 'VULN-001');
    expect(sqli?.score).toBe(20); // likelihood 4 × impact 5
    expect(sqli?.asset).toBe('Web App');
  });

  it('ignores unknown vulnerability ids', () => {
    const risks = buildRiskRegister({ X: ['VULN-001', 'NOT-REAL'] });
    expect(risks).toHaveLength(1);
  });

  it('returns empty for empty input', () => {
    expect(buildRiskRegister({})).toEqual([]);
  });
});

describe('riskDistribution', () => {
  it('buckets scores into the correct severity bands', () => {
    const risks = buildRiskRegister({
      A: ['VULN-001'], // 20 -> Critical
      B: ['VULN-006'], // 15 -> High
      C: ['VULN-013'], // 9  -> Medium
      D: ['VULN-003'], // 8  -> Medium
    });
    const dist = riskDistribution(risks);
    expect(dist.Critical).toBe(1);
    expect(dist.High).toBe(1);
    expect(dist.Medium).toBe(2);
    expect(dist.Low).toBe(0);
  });
});
