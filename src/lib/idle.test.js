import { describe, it, expect } from 'vitest';
import { idleDays, dustLevel, idleColor, streak, sameReasonCount, similarProjects, shelfTimestamps } from './idle.js';

const DAY = 86_400_000;
const base = {
  id: 'a',
  name: 'A',
  reason: 'complex',
  completion: 50,
  lastTouchedAt: Date.now() - 45 * DAY
};

describe('idle', () => {
  it('idleDays counts whole days and floors at 0', () => {
    expect(idleDays({ lastTouchedAt: Date.now() - 10 * DAY })).toBe(10);
    expect(idleDays({ lastTouchedAt: Date.now() + 10 * DAY })).toBe(0);
    expect(idleDays({})).toBe(0);
  });

  it('dustLevel ramps 0 → 1 by ~90 days', () => {
    expect(dustLevel(3)).toBe(0);
    expect(dustLevel(7)).toBe(0);
    expect(dustLevel(90)).toBe(1);
    expect(dustLevel(200)).toBe(1);
    expect(dustLevel(45)).toBeGreaterThan(0);
    expect(dustLevel(45)).toBeLessThan(1);
  });

  it('idleColor returns green under a week then warm hues past it', () => {
    expect(idleColor(2)).toBe('#3f9e6a');
    expect(idleColor(20)).toContain('hsl');
  });

  it('streak counts consecutive days ending today or yesterday', () => {
    const now = Date.now();
    const today = now;
    const d1 = now - DAY, d2 = now - 2 * DAY, gap = now - 4 * DAY;
    expect(streak([today, d1, d2], now)).toBe(3);
    expect(streak([d1, d2], now)).toBe(2);
    expect(streak([gap], now)).toBe(0);
    expect(streak([], now)).toBe(0);
  });

  it('shelfTimestamps picks only closure-like events', () => {
    const t = shelfTimestamps([
      { timeline: [{ type: 'started', at: 1 }, { type: 'closed', at: 2 }, { type: 'decision', at: 3 }, { type: 'milestone', at: 4 }] }
    ]);
    expect(t).toEqual([2, 3]);
  });

  it('similarProjects scores same reason + near completion', () => {
    const a = { ...base, id: 'a' };
    const b = { ...base, id: 'b', reason: 'complex', completion: 55 };
    const c = { ...base, id: 'c', reason: 'time', completion: 95 };
    const sim = similarProjects(a, [a, b, c]);
    expect(sim.map((o) => o.id)).toEqual(['b']);
    expect(sameReasonCount(a, [a, b, c])).toBe(1);
  });
});
