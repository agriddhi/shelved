import { describe, it, expect } from 'vitest';
import { toColdStartDoc, SEED } from './store.js';

describe('toColdStartDoc', () => {
  const p = SEED.find((s) => s.id === 'seed-study'); // time-stopped, 60%, has done/remaining

  it('contains the project goal, completion and reason', () => {
    const doc = toColdStartDoc(p);
    expect(doc).toContain(p.name);
    expect(doc).toContain('60%');
    expect(doc).toContain(p.goal);
    expect(doc.toLowerCase()).toContain('no time');
  });

  it('lists remaining items with the first one marked start-here', () => {
    const doc = toColdStartDoc(p);
    p.remaining.forEach((r) => expect(doc).toContain(r));
    expect(doc).toContain('← start here');
  });

  it('always includes a first-30-minutes plan and a resume sentence', () => {
    const doc = toColdStartDoc(p);
    expect(doc).toContain('Your first 30 minutes');
    expect(doc).toContain('Resume sentence');
  });

  it('produces valid markdown headings', () => {
    const doc = toColdStartDoc(p);
    expect(doc).toMatch(/^# /);
    expect(doc).toContain('## Your first 30 minutes');
  });

  it('handles a project with no remaining work', () => {
    const doc = toColdStartDoc({ ...p, remaining: [] });
    expect(doc).toContain('remaining list is done');
  });

  it('is deterministic in structure (same project, same content modulo date)', () => {
    expect(toColdStartDoc(p)).toBe(toColdStartDoc(p));
  });
});
