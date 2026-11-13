# Shelved

**Keep the context, keep the project.**
A guided closure tool for unfinished side projects — capture what got done, what remained and *why* it stopped, so restarting is cheaper than starting over.

> RunUp Coders Hackathon 2026 · Round 2 · KairoAeonTech (solo — Riddhi Agrawal)

---

## Why

- **>50% of hackathon repos are dormant within 6 days** — Nolte et al., CSCW 2020.
- **51% of people give up on websites they can't figure out** — All About Cookies, 2024.

Side projects don't die from lack of ideas; they die from **lost context**. When you come back three months later, the code is gone, the reasoning is gone, and starting over feels cheaper than resuming. Shelved captures the context at the moment you stop — in under two minutes.

## What it does

| Feature | What you get |
|---|---|
| **Guided closure flow** (centerpiece) | 5 steps: what it was → done → remaining → *stop reason* → AI-drafted context card you approve. Timer shows how long it took. |
| **Project profile page** | The full context card: description, done/remaining restart map, completion ring, automatic timeline, saved suggestions. |
| **Thinking space** | Free-form notes + three actions — *Simplify*, *Sharpen*, *Next Steps*. Every AI response is a keep-or-dismiss card; you are the editor. |
| **Decision recommendations** | A deterministic engine ranks Restart / Continue / Simplify / Repurpose / Archive from stop reason + completion + days idle, each with plain-language reasons. |
| **Organized archive** | Filter every project by status, stop reason or keyword. Nothing is ever deleted. |
| **Impact dashboard** | Revived count, avg idle, why-projects-stopped chart, completion spread, longest-waiting nudge, revival rate, and **"What your shelf told me"** — data-derived insights naming your anti-pattern. |
| **AI reason suggestion** | The closure flow reads your answers and suggests the stop reason (keyword scorer + optional LLM boost). Deterministic, always available. |
| **Cold-start kit** | One Markdown packet per project: goal, done/remaining, first-30-minutes plan, resume sentence. Downloads with one click. |
| **Staleness nudge** | Home screen flags anything paused ≥30 days with a one-click "Decide now". |
| **README export** | Download the context card as Markdown, or copy-as-Markdown for instant sharing. |
| **Responsive pass + light/dark themes** | Real two-theme design (warm near-white day / lifted plum night) with a toggle, persisted across sessions. |

## Architecture

```
src/
├── App.jsx                 shell: sidebar nav, routing, theme, toast
├── views/                  Home, ClosureFlow, Profile, ThinkingSpace,
│                           Decision, ArchiveView, Dashboard
├── components/             HoldButton, CardSpread, TimelineSlider, Stats15
└── lib/
    ├── store.js            data model, seed, localStorage, Markdown export
    ├── recommender.js      pure decision engine (tested)
    ├── drafts.js           rule-based text generators (tested)
    └── ai.js               hybrid AI client: /api/ai → rules fallback
api/
└── ai.js                   Vercel function — OpenAI-compatible proxy
```

### Hybrid AI — works with or without network

1. The client posts to `/api/ai` (Vercel function → any OpenAI-compatible endpoint via `OPENAI_BASE_URL`).
2. On **any** failure — no key, 4xx, timeout, offline — it silently falls back to the **deterministic rule-based generators** in `src/lib/drafts.js`.
3. The UI labels each result: `AI DRAFT · LLM` or `AI DRAFT · RULE-BASED FALLBACK`.

**The demo never breaks** because the network does. No key, no problem.

### Decision engine — testable, not prompt randomness

`recommend({ reason, completion, days })` is a pure function over a fixed score table: same inputs always produce the same ranking, with reasons attached. It's covered by unit tests, runs offline, and shows its scores in the UI.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 23 unit tests (recommender + text generators)
npm run build      # production bundle
```

Optional AI configuration (copy `.env.local.example` → `.env.local` for dev; set the same three in Vercel → Settings → Environment Variables for production):

```
OPENAI_API_KEY=your-key-here
OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
AI_MODEL=gemini-3-flash-preview
```

Any OpenAI-compatible endpoint works (Gemini free key shown). No key → the app serves rule-based drafts instead, labeled accordingly.

## Data & privacy

Everything lives in `localStorage` on the device — **your data never leaves this browser**. The only network calls are the optional AI drafts. Export any project as Markdown at any time.

## Stack

Vite · React 19 · Tailwind 4 · Vitest · Vercel Functions · vanilla JS (JSDoc annotated)

---

Shelved · KairoAeonTech · RunUp Coders Hackathon 2026 · Code Variant — Build 01
