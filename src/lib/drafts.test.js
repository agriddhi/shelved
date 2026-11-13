import { describe, it, expect } from 'vitest';
import { draftDescription, aiSuggest } from './drafts.js';

describe('draftDescription', () => {
  const answers = {
    name: 'Study Planner',
    goal: 'a semester planner for students',
    done: ['Auth & onboarding', 'Dashboard v2'],
    remaining: ['Calendar sync', 'Reminder engine'],
    reasonLabel: 'No time',
    reasonNote: 'placement prep took the evenings',
    completion: 60
  };

  it('mentions the project name, goal and completion', () => {
    const d = draftDescription(answers);
    expect(d).toContain('Study Planner');
    expect(d).toContain('a semester planner for students');
    expect(d).toContain('60%');
  });

  it('lists completed and remaining work', () => {
    const d = draftDescription(answers);
    expect(d).toContain('Auth & onboarding');
    expect(d).toContain('Dashboard v2');
    expect(d).toContain('Calendar sync');
    expect(d).toContain('Reminder engine');
  });

  it('includes the stop reason and note', () => {
    const d = draftDescription(answers);
    expect(d.toLowerCase()).toContain('no time');
    expect(d).toContain('placement prep took the evenings');
  });

  it('is deterministic — identical output for identical input', () => {
    expect(draftDescription(answers)).toBe(draftDescription(answers));
  });

  it('never throws on sparse input', () => {
    const d = draftDescription({ name: 'X' });
    expect(typeof d).toBe('string');
    expect(d.length).toBeGreaterThan(0);
  });

  it('joins lists naturally with "and"', () => {
    const d = draftDescription({ ...answers, done: ['A', 'B', 'C'], remaining: [] });
    expect(d).toContain('A, B and C');
  });
});

describe('aiSuggest', () => {
  const project = {
    name: 'ML Notes Search',
    notes: 'The vector backend needs auth',
    completion: 85,
    remaining: ['Vector backend', 'Deployment']
  };

  it('Simplify returns a scope-cutting suggestion', () => {
    const s = aiSuggest('Simplify', project);
    expect(s).toContain('ML Notes Search');
    expect(s).toContain('15%');
  });

  it('Sharpen turns notes into a concrete finish line', () => {
    const s = aiSuggest('Sharpen', project);
    expect(s).toContain('vector backend');
    expect(s).toContain('scope');
  });

  it('Next Steps returns an ordered plan', () => {
    const s = aiSuggest('Next Steps', project);
    expect(s).toContain('1.');
    expect(s).toContain('Vector backend');
    expect(s).toContain('Time-box');
  });

  it('works without notes (falls back to remaining work)', () => {
    const s = aiSuggest('Simplify', { name: 'Demo', completion: 40, remaining: ['Ship it'] });
    expect(s.toLowerCase()).toContain('ship it');
  });

  it('is deterministic', () => {
    expect(aiSuggest('Sharpen', project)).toBe(aiSuggest('Sharpen', project));
  });

  it('unknown action returns notes or a prompt to record some', () => {
    expect(typeof aiSuggest('Dance', project)).toBe('string');
  });
});
