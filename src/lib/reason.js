/**
 * Keyword-based stop-reason inference — the deterministic half of the
 * "AI suggests why you stopped" chip on the closure flow.
 *
 * Scores the author's free text against a small lexicon per reason.
 * Always available, no network needed, same input → same output.
 */

export const REASON_LEXICON = {
  time: [
    'exam', 'deadline', 'placement', 'interview', 'job', 'semester', 'no time',
    'crunch', 'busy', 'college', 'assignment', 'midsem', 'finals', 'study',
    'work', 'shift', 'family', 'travel'
  ],
  complex: [
    'backend', 'auth', 'vector', 'infra', 'scale', 'complex', 'rewrite', 'bug',
    'broken', 'refactor', 'database', 'deploy', 'devops', 'error', 'architecture',
    'integration', 'docker', 'api', 'schema'
  ],
  lost: [
    'bored', 'boring', 'spark', 'jam', 'fun', 'itch', 'curiosity', 'game',
    'tired', 'demotiv', 'interest', 'novelty', 'cool idea', 'passion'
  ],
  moved: [
    'pivot', 'new idea', 'better deal', 'newsletter', 'another project', 'bigger',
    'different idea', 'moved on', 'more important', 'better idea'
  ]
};

/**
 * @param {{name?: string, goal?: string, done?: string[], remaining?: string[], notes?: string, completion?: number}} input
 * @returns {{key: string, confidence: number, hits: Record<string, number>} | null}
 *          null when there is nothing to go on
 */
export function suggestReason({ name = '', goal = '', done = [], remaining = [], notes = '', completion = 50 } = {}) {
  const text = [name, goal, ...(done || []), ...(remaining || []), notes]
    .join(' ')
    .toLowerCase();
  if (text.trim().length < 12) return null;

  const hits = {};
  for (const [key, words] of Object.entries(REASON_LEXICON)) {
    hits[key] = words.reduce((sum, word) => {
      const idx = text.indexOf(word);
      if (idx === -1) return sum;
      // count occurrences (bounded to avoid one repeated word dominating)
      let count = 0;
      let at = idx;
      while (at !== -1 && count < 5) {
        count += 1;
        at = text.indexOf(word, at + word.length);
      }
      return sum + count;
    }, 0);
  }

  // small structural priors from completion
  if (completion >= 75) hits.time = (hits.time || 0) + 2; // usually ran out of road at the end
  if (completion <= 30) hits.lost = (hits.lost || 0) + 1;

  const total = Object.values(hits).reduce((s, n) => s + n, 0);
  if (total === 0) return null;

  const [bestKey, bestScore] = Object.entries(hits).sort((a, b) => b[1] - a[1])[0];
  if (bestScore === 0) return null;

  const confidence = Math.round((bestScore / total) * 100);
  return { key: bestKey, confidence, hits };
}
