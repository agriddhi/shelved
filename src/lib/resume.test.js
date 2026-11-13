import { describe, it, expect } from 'vitest';
import { resumeScore, RESUME_RULES } from './resume.js';

const full = {
  name: 'Study Planner',
  goal: 'a semester planner for students with reminders',
  description: 'Study Planner is a semester planner for students: course setup, a dashboard and local persistence are done. Calendar sync remains.',
  done: ['Auth', 'Dashboard'],
  remaining: ['Calendar sync'],
  reason: 'time',
  reasonNote: 'exams',
  timeline: [{ type: 'started', at: 1 }, { type: 'closed', at: 2 }],
  notes: 'could cut sync',
  completion: 60
};

describe('resumeScore', () => {
  it('gives a full project 100 with nothing missing', () => {
    const { score, missing } = resumeScore(full);
    expect(score).toBe(100);
    expect(missing).toHaveLength(0);
  });

  it('rule points sum to 100', () => {
    expect(RESUME_RULES.reduce((s, r) => s + r.points, 0)).toBe(100);
  });

  it('an empty project scores 0 and reports everything missing', () => {
    const { score, missing } = resumeScore({});
    expect(score).toBe(0);
    expect(missing).toHaveLength(RESUME_RULES.length);
  });

  it('a bare-bones project lists exactly what is missing', () => {
    const { score, missing } = resumeScore({ goal: 'a real goal here', completion: 40 });
    expect(score).toBe(15 + 5);
    expect(missing.map((m) => m.key)).toContain('description');
    expect(missing.map((m) => m.key)).toContain('reason');
    expect(missing.map((m) => m.key)).not.toContain('goal');
  });

  it('is deterministic', () => {
    expect(JSON.stringify(resumeScore(full))).toBe(JSON.stringify(resumeScore(full)));
  });
});
