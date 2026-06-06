import { describe, it, expect } from 'vitest';
import { calcExposure } from '@/services/engines/exposure-engine';

describe('calcExposure', () => {
  it('returns Unknown when no organization name is set', () => {
    const e = calcExposure({ name: '' });
    expect(e.level).toBe('Unknown');
    expect(e.score).toBe(0);
  });

  it('rates a finance cloud enterprise as Critical', () => {
    // Finance(3) + 1000+(4) + Cloud(3) = 10
    const e = calcExposure({
      name: 'BigBank',
      sector: 'Finance',
      employees: '1000+',
      system: 'Cloud Infrastructure',
    });
    expect(e.score).toBe(10);
    expect(e.level).toBe('Critical');
  });

  it('rates a small retail internal network as Low', () => {
    // Retail(1) + 1-50(1) + Internal(1) = 3
    const e = calcExposure({
      name: 'Corner Shop',
      sector: 'Retail',
      employees: '1-50',
      system: 'Internal Network',
    });
    expect(e.score).toBe(3);
    expect(e.level).toBe('Low');
  });

  it('rates a mid-size education web app appropriately', () => {
    // Education(2) + 201-1000(3) + Web(3) = 8 -> Critical boundary
    const e = calcExposure({
      name: 'University',
      sector: 'Education',
      employees: '201-1000',
      system: 'Web Application',
    });
    expect(e.score).toBe(8);
    expect(e.level).toBe('Critical');
  });

  it('always returns a valid icon name and color token', () => {
    const e = calcExposure({
      name: 'Test',
      sector: 'Technology',
      employees: '51-200',
      system: 'Hybrid',
    });
    expect(typeof e.icon).toBe('string');
    expect(e.color).toContain('var(--');
  });
});
