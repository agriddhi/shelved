/**
 * Shelved — serverless AI endpoint (Vercel function).
 *
 * OpenAI-compatible chat completions proxy. Configuration via env:
 *   OPENAI_API_KEY   — required (sk-... or provider key)
 *   OPENAI_BASE_URL  — optional (defaults to https://api.openai.com/v1)
 *   AI_MODEL         — optional (defaults to gpt-4o-mini)
 *
 * The client (src/lib/ai.js) treats ANY failure here — missing key, 4xx,
 * timeout — as "fall back to the deterministic rules", so the demo never
 * breaks when this function is unconfigured or offline.
 */

const SYSTEM = {
  draft:
    'You write the "context card" for a shelved software project — a short, honest paragraph a future version of the author will read to restart it. Plain language, no hype, no bullet points, 3-5 sentences. State what it was built to do, what got done, what remains, how complete it is, and why it stopped (in the author\'s words if given). End with a clause making clear the full context is recorded for a clean restart.',
  suggest:
    'You are a pragmatic engineering coach giving ONE suggestion for a paused side project. Give exactly the requested kind of advice (Simplify, Sharpen or Next Steps), in plain language, max 4 short sentences or a 3-item numbered list for Next Steps. Be concrete and specific to the project described — no generic platitudes, no preamble, no markdown headers.'
};

function buildPrompt(kind, body) {
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    res.status(503).json({ error: 'AI not configured' });
    return;
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body || {};
  const kind = body.kind === 'suggest' ? 'suggest' : 'draft';
  const baseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const model = process.env.AI_MODEL || 'gpt-4o-mini';

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
        max_tokens: 400,
        messages: [
          { role: 'system', content: SYSTEM[kind] },
          { role: 'user', content: buildPrompt(kind, body) }
        ]
      })
    });

    if (!upstream.ok) {
      res.status(502).json({ error: `Upstream ${upstream.status}` });
      return;
    }

    const data = await upstream.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) {
      res.status(502).json({ error: 'Empty completion' });
      return;
    }
    res.status(200).json({ text, model });
  } catch (err) {
    res.status(502).json({ error: String(err && err.message ? err.message : err) });
  }
}

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
