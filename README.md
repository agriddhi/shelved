# Shelved

**Keep the context, keep the project.**
A guided closure ritual for unfinished side projects — capture what got done, what remained and *why* it stopped, so restarting is cheaper than starting over.

> RunUp Coders Hackathon 2026 · Round 2 · KairoAeonTech (solo — Riddhi Agrawal)

---

## Why

- **>50% of hackathon repos are dormant within 6 days** — Nolte et al., CSCW 2020.
- **51% of people give up on websites they can't figure out** — All About Cookies, 2024.

Side projects don't die from lack of ideas; they die from **lost context**. When you come back three months later, the code is gone, the reasoning is gone, and starting over feels cheaper than resuming. Shelved captures the context at the moment you stop — in under two minutes.

## What it does

| Feature | What you get |
|---|---|
| **Closure ritual** (centerpiece) | 5 steps — stop reason → completion gauge → completed/remaining lists → AI-drafted context card you approve → review & save. The card **flies into the shelf** as a real book spine with a soft thud. |
| **Project profile** | Full context card: reason tag, done/remaining restart map, completion gauge, automatic timeline, restart-readiness gauge, saved suggestions, "you also shelved" links. |
| **Thinking space** | Free notes + *Simplify* / *Sharpen* / *Next Steps* actions. Every AI response is a keep-or-dismiss card — you are the editor. |
| **Decision engine** | `recommend({ reason, completion, days })` — a pure, tested function ranks Restart / Continue / Simplify / Repurpose / Archive with plain-language reasons and visible scores. |
| **Organized archive** | Search + filter by status / reason / keyword. **Spring-clean** batch mode: select all, restart selected, archive selected. Export the whole shelf as a ZIP of Markdown + `shelf.json`. |
| **Impact dashboard** | Revived count, revival rate, completion spread, "What your shelf told me" — data-derived insights naming your anti-pattern (scope walls, time patterns, cold dust). |
| **Staleness nudge** | Home flags anything paused ≥30 days with a one-click "Decide now" — plus a streak badge for days of honest endings. |
| **Spin the shelf** | Can't decide? A slot-machine spin lands on a stalled project and takes you straight to its decision screen. |
| **Cold-start kit** | One Markdown packet per project: goal, done/remaining, first-30-minutes plan, resume sentence. One click download. |
| **Hybrid AI** | Gemini via Vercel proxy (or any OpenAI-compatible endpoint), with deterministic offline fallback — labelled `AI DRAFT · LLM` / `AI DRAFT · RULE-BASED FALLBACK`. |
| **Spine shelf** | Recently-closed projects as a book spine shelf — height = completion, dust speckles grow with idle time; revive glow when you bring one back. |
| **Design system** | Plum & Indigo themes × light/dark, Space Grotesk + JetBrains Mono typography, zero-flash bootstrap, keyboard shortcuts (N / A / D / 1–9 / Esc / ?). |

## Architecture

```
src/
├── App.jsx                 shell: sidebar/tab-bar nav, routing, themes, shortcuts
├── views/                  Home, ClosureFlow, Profile, ThinkingSpace,
│                           Decision, ArchiveView, Dashboard
├── components/             SpineShelf, ShelvingOverlay, ResumeRing,
│                           Extras (toasts/banner/chips/modal), PageTransition,
│                           CompletionRing, Tooltip, HoldButton, TimelineSlider
└── lib/
    ├── store.js            data model, evergreen seed, localStorage, streak, Markdown export
    ├── recommender.js      pure decision engine (tested)
    ├── drafts.js           rule-based text generators (tested)
    ├── reason.js           keyword-based stop-reason inference (tested)
    ├── resume.js           restart-readiness scorer (tested)
    ├── idle.js             dust level / streak / similarity maths (tested)
    └── ai.js, ai-core.mjs  hybrid AI client; Vercel proxy lives in api/ai.js
api/
├── ai.js                   Vercel function — OpenAI-compatible proxy
└── ai-core.mjs             shared upstream logic (used by Vercel + Vite dev)
```

### Hybrid AI — never leaves you stuck

1. The client posts to `/api/ai` (Vercel function → any OpenAI-compatible endpoint via `OPENAI_BASE_URL`).
2. On **any** failure — no key, 4xx, timeout, offline — it silently falls back to the **deterministic rule-based generators** in `src/lib/drafts.js`.
3. Every result is labelled `AI DRAFT · LLM` or `AI DRAFT · RULE-BASED FALLBACK`.

**The demo never breaks** because the Wi-Fi does. No key, no problem, fully offline.

### Decision engine — testable, not prompt randomness

`recommend({ reason, completion, days })` is a pure function over a fixed score table — same inputs, same ranking, always, with reasons attached. Covered by unit tests, runs offline, and the score is visible in the UI.

### PWA & offline

Vite build · service worker precaches the shell · `localStorage`-first persistence · works with zero network. Install it from the browser and it runs like a native app.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 46 unit tests
npm run build      # production bundle
```

Optional AI configuration (copy `.env.local.example` → `.env.local` for dev; set the same three in Vercel → Settings → Environment Variables for production):

```
OPENAI_API_KEY=your-key-here
OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
AI_MODEL=gemini-3-flash-preview
```

Any OpenAI-compatible endpoint works (Gemini free tier shown). No key → rule-based drafts instead, labelled accordingly.

## Data & privacy

Everything lives in `localStorage` on the device — **your data never leaves this browser**. Only the optional AI drafts make network calls. Export the entire shelf as a ZIP of Markdown at any time.

## Stack

Vite · React 19 · Tailwind 4 · Vitest · framer-motion · Vercel Functions · vanilla JS (JSDoc annotated)

---

Shelved · KairoAeonTech · RunUp Coders Hackathon 2026 · Code Variant — Build 01
