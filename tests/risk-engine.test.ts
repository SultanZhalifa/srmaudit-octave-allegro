import { describe, it, expect } from 'vitest';
import {
  calcCriticality,
  buildRiskRegister,
  rateRisk,
  resetRating,
  riskDistribution,
} from '@/services/engines/risk-engine';
import { generateFindings } from '@/services/engines/findings-engine';
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

/** The item at `index`, or a clear failure instead of `undefined`. */
const at = <T>(items: T[], index: number): T => {
  const item = items[index];
  if (item === undefined) throw new Error(`no item at index ${index}`);
  return item;
};

describe('rating a risk', () => {
  const threats = { 'Student DB': ['VULN-001'], 'Web Server': ['VULN-003'] };

  it('starts at the catalogue defaults and is not marked as rated', () => {
    const sql = at(buildRiskRegister(threats), 0);
    expect([sql.likelihood, sql.impact, sql.score]).toEqual([4, 5, 20]);
    expect(sql).not.toHaveProperty('rated');
  });

  it('works the score out again from the new likelihood and impact', () => {
    const sql = at(buildRiskRegister(threats), 0);
    const rated = rateRisk(sql, 2, 3);
    expect([rated.likelihood, rated.impact, rated.score, rated.rated]).toEqual([2, 3, 6, true]);
    expect(sql.score).toBe(20); // the original is not changed
  });

  it('keeps ratings between 1 and 5 whole numbers, and ignores values that are not numbers', () => {
    const sql = at(buildRiskRegister(threats), 0);
    expect(rateRisk(sql, 9, -3)).toMatchObject({ likelihood: 5, impact: 1, score: 5 });
    expect(rateRisk(sql, 2.6, 0.4)).toMatchObject({ likelihood: 3, impact: 1, score: 3 });
    expect(rateRisk(sql, Number.NaN, 2)).toMatchObject({ likelihood: 4, impact: 2, score: 8 });
  });

  it('keeps the user ratings when the assessment is run again', () => {
    const first = buildRiskRegister(threats);
    const edited = [rateRisk(at(first, 0), 1, 2), at(first, 1)];
    const again = buildRiskRegister(threats, edited);
    expect(at(again, 0)).toMatchObject({ likelihood: 1, impact: 2, score: 2, rated: true });
    expect(at(again, 1).rated).toBeUndefined();
    expect(at(again, 1).score).toBe(at(first, 1).score);
  });

  it('matches ratings by asset and vulnerability, so another asset keeps its defaults', () => {
    const edited = [rateRisk(at(buildRiskRegister({ 'Student DB': ['VULN-001'] }), 0), 1, 1)];
    const again = buildRiskRegister(
      { 'Student DB': ['VULN-001'], 'Other DB': ['VULN-001'] },
      edited,
    );
    expect(again.find((r) => r.asset === 'Student DB')?.score).toBe(1);
    expect(again.find((r) => r.asset === 'Other DB')?.score).toBe(20);
  });

  it('drops a rated risk whose threat was removed', () => {
    const edited = [rateRisk(at(buildRiskRegister(threats), 0), 1, 1)];
    expect(buildRiskRegister({ 'Web Server': ['VULN-003'] }, edited)).toHaveLength(1);
  });

  it('goes back to the defaults on reset', () => {
    const sql = at(buildRiskRegister(threats), 0);
    const back = resetRating(rateRisk(sql, 1, 1));
    expect(back).toEqual(sql);
    expect(back).not.toHaveProperty('rated');
  });

  it('changes which risks become findings (a score of 10 or more)', () => {
    const sql = at(buildRiskRegister({ 'Student DB': ['VULN-001'] }), 0);
    expect(generateFindings([sql], []).length).toBeGreaterThan(0);
    expect(generateFindings([rateRisk(sql, 1, 2)], [])).toHaveLength(0);
  });
});
