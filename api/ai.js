/**
 * Shelved — serverless AI endpoint (Vercel function).
 *
 * Configure in Vercel → Settings → Environment Variables (and .env.local for dev):
 *   OPENAI_API_KEY   — your key (Gemini free key works)
 *   OPENAI_BASE_URL  — https://generativelanguage.googleapis.com/v1beta/openai
 *   AI_MODEL         — gemini-3.6-flash
 *
 * The client (src/lib/ai.js) treats ANY failure here — missing key, 4xx,
 * timeout, offline — as "fall back to the deterministic rules", so the
 * demo never breaks when this function is unconfigured or offline.
 */
import { callUpstream } from './ai-core.mjs';

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body || {};
  const { text, model, error, status } = await callUpstream(body, process.env);
  if (error) {
    res.status(status || 502).json({ error });
    return;
  }
  res.status(200).json({ text, model });
}
