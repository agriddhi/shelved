/**
 * Rule-based text generation — the deterministic AI fallback.
 * Sentence builders over the closure answers: always available, never fails.
 */

function list(arr) {
  const a = (arr || []).filter(Boolean);
  if (!a.length) return '';
  if (a.length === 1) return a[0];
  return `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`;
}

/**
 * Build the closure description from the guided answers.
 * @param {{name: string, goal?: string, done?: string[], remaining?: string[],
 *          reasonLabel?: string, reasonNote?: string, completion?: number}} a
 * @returns {string}
 */
export function draftDescription(a) {
  const parts = [];
  parts.push(
    `${a.name || 'This project'} was started to build ${a.goal || 'a first working version'}.`
  );
  if (a.done?.length) parts.push(`Completed so far: ${list(a.done)}.`);
  if (a.remaining?.length) parts.push(`Still remaining: ${list(a.remaining)}.`);
  parts.push(`As of the closure it stands at about ${a.completion ?? 50}% complete.`);
  const reason = (a.reasonLabel || '').toLowerCase();
  if (reason) {
    parts.push(
      a.reasonNote
        ? `It was stopped because it felt ${reason} — ${a.reasonNote}.`
        : `It was stopped because it felt ${reason}.`
    );
  }
  parts.push(
    'Everything needed to return — what was done, what is left, and why it stopped — is recorded here.'
  );
  return parts.join(' ');
}

/**
 * Thinking-space actions over a project's notes.
 * @param {'Simplify'|'Sharpen'|'Next Steps'} action
 * @param {{name?: string, notes?: string, done?: string[], remaining?: string[]}} p
 * @returns {string}
 */
export function aiSuggest(action, p) {
  const name = p.name || 'this project';
  const notes = (p.notes || '').trim();
  const seed = notes
    ? notes.split(/[.\n]/)[0].trim()
    : p.remaining?.[0]
      ? `finish ${p.remaining[0].toLowerCase()}`
      : 'ship the smallest working version';

  switch (action) {
    case 'Simplify':
      return `Cut ${name} to its core: ${seed}. Drop everything that does not serve that one outcome — the remaining ${100 - (p.completion ?? 50)}% should fit into a single free weekend if the scope stops growing.`;
    case 'Sharpen':
      return `Make it concrete: "${seed}" becomes a finish line — ${name} is done when that one outcome works end-to-end for one real user, with no placeholders. Anything that does not touch that path is out of scope.`;
    case 'Next Steps':
      return [
        `1. ${seed.charAt(0).toUpperCase()}${seed.slice(1)}.`,
        p.remaining?.length ? `2. Then: ${list(p.remaining)}.` : '2. Then: clear the remaining list one item at a time.',
        '3. Close the loop — record the milestone on the timeline and re-run the decision check.',
        `Time-box it: two sessions, or ${name} goes back through closure with an honest reason.`
      ].join('\n');
    default:
      return notes || 'Record a note first — the clearer the input, the sharper the suggestion.';
  }
}
