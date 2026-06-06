import { describe, it, expect } from 'vitest';
import { getComplianceStats } from '@/services/engines/compliance-engine';
import type { ChecklistItem, ControlStatus } from '@/core/types';

function items(...statuses: ControlStatus[]): ChecklistItem[] {
  return statuses.map((status, i) => ({
    title: `Control ${i}`,
    description: '',
    source: 'test',
    status,
    notes: '',
  }));
}

describe('getComplianceStats', () => {
  it('returns 0% / Needs Immediate Action for an empty checklist', () => {
    const s = getComplianceStats([]);
    expect(s.pct).toBe(0);
    expect(s.opinion).toBe('Needs Immediate Action');
  });

  it('scores partial as half weight', () => {
    // 1 compliant + 1 partial over 2 applicable = (1 + 0.5)/2 = 75%
    const s = getComplianceStats(items('compliant', 'partially'));
    expect(s.pct).toBe(75);
    expect(s.label).toBe('Needs Improvement');
    expect(s.opinion).toBe('Acceptable Risk');
  });

  it('excludes pending and N/A from the applicable denominator', () => {
    // applicable = 2 (compliant, non-compliant); pending & na ignored
    const s = getComplianceStats(items('compliant', 'non-compliant', 'pending', 'na'));
    expect(s.applicable).toBe(2);
    expect(s.pct).toBe(50);
  });

  it('reports a fully compliant set as Secure', () => {
    const s = getComplianceStats(items('compliant', 'compliant', 'compliant'));
    expect(s.pct).toBe(100);
    expect(s.label).toBe('Compliant');
    expect(s.opinion).toBe('Secure');
  });

  it('counts each status correctly', () => {
    const s = getComplianceStats(items('compliant', 'partially', 'non-compliant', 'pending', 'na'));
    expect(s).toMatchObject({ compliant: 1, partial: 1, nonComp: 1, pending: 1, na: 1 });
  });
});
