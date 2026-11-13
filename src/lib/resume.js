/**
 * Resume score — how ready is this project to be picked up again cold?
 * Pure function, deterministic, no AI. Shows what's missing and why.
 */

export const RESUME_RULES = [
  { key: 'goal', label: 'A clear goal', points: 15, test: (p) => (p.goal || '').trim().length >= 12 },
  { key: 'description', label: 'A context card', points: 20, test: (p) => (p.description || '').trim().length >= 40 },
  { key: 'done', label: 'What was finished', points: 15, test: (p) => (p.done || []).filter(Boolean).length >= 1 },
  { key: 'remaining', label: 'What remains', points: 15, test: (p) => (p.remaining || []).filter(Boolean).length >= 1 },
  { key: 'reason', label: 'Why it stopped', points: 10, test: (p) => !!p.reason },
  { key: 'reasonNote', label: 'Stop note in your words', points: 5, test: (p) => !!(p.reasonNote || '').trim() },
  { key: 'timeline', label: 'An automatic timeline', points: 10, test: (p) => (p.timeline || []).length >= 2 },
  { key: 'notes', label: 'A thinking note', points: 5, test: (p) => !!(p.notes || '').trim() },
  { key: 'progress', label: 'Honest progress estimate', points: 5, test: (p) => typeof p.completion === 'number' && p.completion > 0 && p.completion <= 100 }
];

/**
 * @param {object} p project
 * @returns {{ score: number, missing: Array<{key: string, label: string, points: number}> }}
 */
export function resumeScore(p) {
  const missing = [];
  let score = 0;
  for (const rule of RESUME_RULES) {
    if (rule.test(p)) {
      score += rule.points;
    } else {
      missing.push({ key: rule.key, label: rule.label, points: rule.points });
    }
  }
  return { score, missing };
}
