import { describe, it, expect } from 'vitest';
import { findKnowledge } from '@/data/knowledge-base';

describe('findKnowledge', () => {
  it('matches SQL injection queries', () => {
    const entry = findKnowledge('explain sql injection to management');
    expect(entry?.title).toBe('SQL Injection');
  });

  it('matches the OCTAVE methodology', () => {
    expect(findKnowledge('summarise the octave allegro methodology')?.title).toBe(
      'OCTAVE Allegro Methodology',
    );
  });

  it('matches backup/ransomware questions', () => {
    expect(findKnowledge('is no backup dangerous for ransomware')?.title).toBe('Backup & Recovery');
  });

  it('returns null when nothing matches', () => {
    expect(findKnowledge('what is the weather today')).toBeNull();
  });

  it('prefers the longest keyword overlap', () => {
    // "cross-site scripting" should win over a bare "scripting" mention
    expect(findKnowledge('cross-site scripting attack')?.title).toBe('Cross-Site Scripting (XSS)');
  });
});
