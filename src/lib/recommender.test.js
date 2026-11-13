import { describe, it, expect } from 'vitest';
import { recommend, OPTIONS } from './recommender.js';

describe('recommend', () => {
  it('returns all five options on every call', () => {
    const ranked = recommend({ reason: 'time', completion: 50, days: 10 });
    expect(ranked).toHaveLength(OPTIONS.length);
    expect(ranked.map((o) => o.key).sort()).toEqual(OPTIONS.map((o) => o.key).sort());
  });

  it('is deterministic — same input, identical ranking', () => {
    const input = { reason: 'complex', completion: 85, days: 8 };
    const a = JSON.stringify(recommend(input));
    const b = JSON.stringify(recommend(input));
    expect(a).toBe(b);
  });

  it('ranks Simplify first for a complex, mostly-done project', () => {
    const ranked = recommend({ reason: 'complex', completion: 85, days: 8 });
    expect(ranked[0].key).toBe('simplify');
  });

  it('ranks Restart first when stopped recently with high completion', () => {
    const ranked = recommend({ reason: 'time', completion: 80, days: 3 });
    expect(ranked[0].key).toBe('restart');
  });

  it('ranks Archive first for a long-idle, moved-on project', () => {
    const ranked = recommend({ reason: 'moved', completion: 40, days: 90 });
    expect(ranked[0].key).toBe('archive');
  });

  it('scores are sorted descending', () => {
    const ranked = recommend({ reason: 'lost', completion: 35, days: 45 });
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].score).toBeGreaterThanOrEqual(ranked[i].score);
    }
  });

  it('every option carries at least one plain-language reason', () => {
    const ranked = recommend({ reason: 'time', completion: 60, days: 12 });
    ranked.forEach((o) => {
      expect(o.reasons.length).toBeGreaterThan(0);
      expect(typeof o.reasons[0]).toBe('string');
      expect(o.reasons[0].length).toBeGreaterThan(10);
    });
  });

  it('falls back to base scores on unknown reason (no crash)', () => {
    const ranked = recommend({ reason: 'banana', completion: 50, days: 5 });
    expect(ranked).toHaveLength(5);
    expect(ranked.every((o) => typeof o.score === 'number')).toBe(true);
  });

  it('handles missing input gracefully', () => {
    const ranked = recommend();
    expect(ranked).toHaveLength(5);
  });

  it('high completion ranks restart higher than low completion does', () => {
    const input = { reason: 'moved', days: 45 };
    const rank = (c) => recommend({ ...input, completion: c }).findIndex((o) => o.key === 'restart');
    expect(rank(90)).toBeLessThan(rank(10));
  });

  it('low completion lifts Simplify above its high-completion rank', () => {
    const input = { reason: 'moved', days: 45 };
    const rank = (c) => recommend({ ...input, completion: c }).findIndex((o) => o.key === 'simplify');
    expect(rank(15)).toBeLessThan(rank(85));
  });
});
