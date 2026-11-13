/**
 * Decision recommender — a deterministic pure function.
 *
 * Maps stop reason + completion % + days idle into five ranked options,
 * each carrying plain-language reasons. No randomness, no prompts:
 * same inputs always produce the same ranking (see recommender.test.js).
 */

export const OPTIONS = [
  { key: 'restart', label: 'Restart', hint: 'Begin again with the context you now have' },
  { key: 'continue', label: 'Continue', hint: 'Pick up from the remaining list' },
  { key: 'simplify', label: 'Simplify', hint: 'Cut the scope until it fits your time' },
  { key: 'repurpose', label: 'Repurpose', hint: 'Move the useful parts into another project' },
  { key: 'archive', label: 'Archive', hint: 'Close it with its story intact' }
];

const BASE = {
  time: { restart: 40, simplify: 24, continue: 16, repurpose: 12, archive: 8 },
  complex: { simplify: 38, repurpose: 24, archive: 16, continue: 14, restart: 8 },
  lost: { repurpose: 32, archive: 28, restart: 16, simplify: 16, continue: 8 },
  moved: { archive: 36, repurpose: 26, simplify: 16, restart: 14, continue: 8 }
};

/**
 * @param {{reason?: string, completion?: number, days?: number}} input
 * @returns {Array<{key: string, label: string, hint: string, score: number, reasons: string[]}>}
 *          all five options, best first
 */
export function recommend({ reason = 'time', completion = 50, days = 0 } = {}) {
  const scores = { ...(BASE[reason] || BASE.time) };
  const why = {};
  const add = (key, delta, text) => {
    scores[key] = (scores[key] || 0) + delta;
    (why[key] = why[key] || []).push(text);
  };

  if (completion >= 70) {
    add('restart', 18, `${completion}% is already done — finishing beats starting over`);
    add('continue', 12, `Only ${100 - completion}% of the work remains`);
    add('archive', -8, 'Heavy investment already made — archiving wastes it');
  } else if (completion <= 35) {
    add('simplify', 14, `At ${completion}%, the original scope outweighs what is left`);
    add('archive', 10, 'Early stage — very little context is lost by letting it go');
  }

  if (days > 60) {
    add('archive', 12, `Idle ${days} days — the reason it stopped still stands`);
    add('repurpose', 8, `${days} days of distance: pieces may fit a newer idea`);
    add('restart', -6, 'A long gap makes the full restart harder');
  } else if (days <= 7) {
    add('restart', 14, `Stopped ${days} day${days === 1 ? '' : 's'} ago — the context is still fresh`);
    add('continue', 6, 'Momentum is barely gone');
  }

  return OPTIONS.map((o) => ({
    ...o,
    score: scores[o.key],
    reasons: (why[o.key] || ['Balanced against your stop reason, completion and time away']).slice(0, 2)
  })).sort((a, b) => b.score - a.score);
}
