/**
 * Shared AI upstream call — used by the Vercel function (api/ai.js)
 * and by the Vite dev middleware (vite.config.js) so the draft flow
 * behaves identically in dev and production.
 *
 * OpenAI-compatible chat completions endpoint. Defaults target the
 * Gemini OpenAI-compatible gateway with gemini-3.6-flash:
 *   OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
 *   OPENAI_API_KEY=AQ...
 *   AI_MODEL=gemini-3.6-flash
 */

const SYSTEM = {
  draft:
    "You write the \"context card\" for a shelved software project — a short, honest paragraph a future version of the author will read to restart it. Plain language, no hype, no bullet points, 3-5 sentences. State what it was built to do, what got done, what remains, how complete it is, and why it stopped (in the author's words if given). End with a clause making clear the full context is recorded for a clean restart.",
  suggest:
    'You are a pragmatic engineering coach giving ONE suggestion for a paused side project. Give exactly the requested kind of advice (Simplify, Sharpen or Next Steps), in plain language, max 4 short sentences or a 3-item numbered list for Next Steps. Be concrete and specific to the project described — no generic platitudes, no preamble, no markdown headers.'
};

export function buildPrompt(kind, body) {
  if (kind === 'suggest') {
    const p = body.project || {};
    return [
      `Action: ${body.action}`,
      `Project: ${p.name || 'unnamed'} (${p.completion ?? '?'}% complete)`,
      `Goal: ${p.goal || 'not recorded'}`,
      `Done: ${(p.done || []).join('; ') || 'none'}`,
      `Remaining: ${(p.remaining || []).join('; ') || 'none'}`,
      `Author's notes: ${p.notes || 'none'}`
    ].join('\n');
  }
  return [
    `Project name: ${body.name || 'unnamed'}`,
    `Goal: ${body.goal || 'not recorded'}`,
    `Completed: ${(body.done || []).join('; ') || 'none'}`,
    `Remaining: ${(body.remaining || []).join('; ') || 'none'}`,
    `Completion: ${body.completion ?? '?'}%`,
    `Stop reason: ${body.reasonLabel || 'unrecorded'}${body.reasonNote ? ` — ${body.reasonNote}` : ''}`
  ].join('\n');
}

export const DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai';
export const DEFAULT_MODEL = 'gemini-3-flash-preview';

/**
 * Call the upstream model.
 * @param {{kind?: string} & Record<string, any>} body
 * @param {{OPENAI_API_KEY?: string, OPENAI_BASE_URL?: string, AI_MODEL?: string}} env
 * @returns {Promise<{text?: string, model?: string, error?: string, status?: number}>}
 */
export async function callUpstream(body, env) {
  const key = env.OPENAI_API_KEY;
  if (!key) return { error: 'AI not configured', status: 503 };

  const kind = body.kind === 'suggest' ? 'suggest' : 'draft';
  const baseUrl = (env.OPENAI_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
  const model = env.AI_MODEL || DEFAULT_MODEL;

  try {
    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 1024,
        messages: [
          { role: 'system', content: SYSTEM[kind] },
          { role: 'user', content: buildPrompt(kind, body) }
        ]
      }),
      signal: AbortSignal.timeout(30000)
    });

    const data = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      return { error: `Upstream ${upstream.status}: ${data?.error?.message || 'unknown'}`, status: 502 };
    }
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) return { error: 'Empty completion', status: 502 };
    return { text, model };
  } catch (err) {
    return { error: String(err && err.message ? err.message : err), status: 502 };
  }
}
