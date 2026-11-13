import { describe, it, expect } from 'vitest';
import { suggestReason } from './reason.js';

describe('suggestReason', () => {
  it('returns null when there is nothing to go on', () => {
    expect(suggestReason({})).toBeNull();
    expect(suggestReason({ name: 'x', goal: '', done: [], remaining: [] })).toBeNull();
  });

  it('detects time pressure from placement/exam vocabulary', () => {
    const r = suggestReason({
      name: 'Study Planner',
      goal: 'a semester planner for students',
      done: ['Auth & onboarding'],
      remaining: ['Deadline reminders'],
      completion: 80
    });
    expect(r).not.toBeNull();
    expect(r.key).toBe('time');
  });

  it('detects complexity walls from infra vocabulary', () => {
    const r = suggestReason({
      name: 'ML Notes Search',
      goal: 'semantic search across notes',
      done: ['Indexing pipeline'],
      remaining: ['Vector backend', 'Deployment'],
      completion: 85
    });
    expect(r.key).toBe('complex');
  });

  it('detects moved-on pivots', () => {
    const r = suggestReason({
      name: 'Dev Blog',
      goal: 'a static blog for build logs',
      done: ['CMS'],
      remaining: ['Better newsletter pivot post'],
      notes: 'A pivot to a newsletter idea was a better deal',
      completion: 60
    });
    expect(r.key).toBe('moved');
  });

  it('is deterministic', () => {
    const input = { name: 'Lumen', goal: 'a two-player light puzzle game', remaining: ['Sound'] };
    expect(JSON.stringify(suggestReason(input))).toBe(JSON.stringify(suggestReason(input)));
  });

  it('confidence stays between 1 and 100', () => {
    const r = suggestReason({ name: 'Test Project XYZ', goal: 'build something useful today', remaining: ['Tests'] });
    if (r) {
      expect(r.confidence).toBeGreaterThanOrEqual(1);
      expect(r.confidence).toBeLessThanOrEqual(100);
    }
  });
});
