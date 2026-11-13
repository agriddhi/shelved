/**
 * AI layer — hybrid.
 * requestDraft()/requestSuggest() try the serverless LLM route (/api/ai)
 * and silently fall back to the deterministic rule-based generators below,
 * so the demo works with or without network, key or server.
 */
import { draftDescription, aiSuggest } from './drafts.js';

async function callAI(payload, timeout = 2200) {
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeout);
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctl.signal
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.text === 'string' && data.text.trim()) {
        return { text: data.text, source: 'llm' };
      }
    }
  } catch {
    /* offline / no key / dev without api — fall through */
  }
  return null;
}

/** Draft the closure description: LLM first, rules always available. */
export async function requestDraft(answers) {
  const llm = await callAI({ kind: 'draft', ...answers });
  if (llm) return llm;
  await new Promise((r) => setTimeout(r, 700)); // brief "thinking" beat for the demo
  return { text: draftDescription(answers), source: 'rules' };
}

/** Thinking-space action: Simplify / Sharpen / Next Steps. */
export async function requestSuggest(action, project) {
  const llm = await callAI({ kind: 'suggest', action, project });
  if (llm) return llm;
  await new Promise((r) => setTimeout(r, 600));
  return { text: aiSuggest(action, project), source: 'rules' };
}
