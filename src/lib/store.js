/**
 * Shelved — data layer.
 * Project model, stop reasons, seed data and localStorage persistence.
 * Everything is plain JSON: the whole archive lives on the device.
 */

export const STORAGE_KEY = 'shelved.projects.v1';

/** The four reasons a project gets closed with. */
export const REASONS = [
  { key: 'complex', label: 'Too complex', desc: 'The scope outgrew the time you had', color: '#5882E8' },
  { key: 'time', label: 'No time', desc: 'Exams, work and deadlines took over', color: '#EEE3B0' },
  { key: 'lost', label: 'Lost interest', desc: 'The spark faded along the way', color: '#F4ACB7' },
  { key: 'moved', label: 'Moved on', desc: 'A newer idea earned your evenings', color: '#D8E2DC' }
];

export const reasonLabel = (key) => REASONS.find((r) => r.key === key)?.label || 'Unrecorded';
export const reasonColor = (key) => REASONS.find((r) => r.key === key)?.color || '#D8E2DC';

export const DAY = 86_400_000;
export const daysSince = (ts) => Math.max(0, Math.floor((Date.now() - (ts || Date.now())) / DAY));
export const daysIdle = (p) => daysSince(p.lastTouchedAt || p.closedAt || p.createdAt);
export const uid = () => `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Pastel card faces, in order (matches the CardSpread deck). */
export const CARD_FACES = ['#EEE3B0', '#FFE5D9', '#FFCAD4', '#F4ACB7', '#D8E2DC'];

const DAY_MS = DAY;
const now = Date.now();

/** Seed data — every screen is populated from first launch. */
export const SEED = [
  {
    id: 'seed-study',
    name: 'Study Planner',
    goal: 'a semester planner for students with reminders and a shared course view',
    description:
      'Study Planner is a semester planner for students: course setup, a dashboard and local persistence are done. Remaining is the calendar sync and the reminder engine. Stopped because there was no time during exams — it stands at about 60% complete with the core screens working.',
    reason: 'time',
    reasonNote: 'Placement prep took the evenings',
    status: 'stopped',
    completion: 60,
    done: ['Auth & onboarding', 'Dashboard v2', 'Local persistence'],
    remaining: ['Calendar sync', 'Reminder engine'],
    notes: 'Calendar sync could be dropped entirely — most students live in one course list anyway.',
    suggestions: [
      { id: 's1', action: 'Simplify', text: 'Cut calendar sync; ship reminders from the course list alone.', kept: true }
    ],
    decision: null,
    timeline: [
      { type: 'started', at: now - 74 * DAY_MS },
      { type: 'milestone', at: now - 59 * DAY_MS },
      { type: 'touched', at: now - 35 * DAY_MS },
      { type: 'closed', at: now - 34 * DAY_MS }
    ],
    createdAt: now - 74 * DAY_MS,
    lastTouchedAt: now - 34 * DAY_MS,
    closedAt: now - 34 * DAY_MS,
    reopenCount: 0
  },
  {
    id: 'seed-ml',
    name: 'ML Notes Search',
    goal: 'semantic search across my handwritten ML notes',
    description:
      'ML Notes Search indexes lecture notes and answers questions from them. The indexer, embeddings and search UI are complete; the vector backend and deployment remain. Stopped because it got too complex — at 85% the last 15% needs infrastructure I did not have time to set up.',
    reason: 'complex',
    reasonNote: 'Vector DB + auth felt like a second project',
    status: 'stopped',
    completion: 85,
    done: ['Indexing pipeline', 'Embeddings', 'Search UI'],
    remaining: ['Vector backend', 'Deployment'],
    notes: '',
    suggestions: [],
    decision: null,
    timeline: [
      { type: 'started', at: now - 40 * DAY_MS },
      { type: 'milestone', at: now - 26 * DAY_MS },
      { type: 'touched', at: now - 9 * DAY_MS },
      { type: 'closed', at: now - 8 * DAY_MS }
    ],
    createdAt: now - 40 * DAY_MS,
    lastTouchedAt: now - 8 * DAY_MS,
    closedAt: now - 8 * DAY_MS,
    reopenCount: 0
  },
  {
    id: 'seed-lumen',
    name: 'Game Jam “Lumen”',
    goal: 'a two-player light-refraction puzzle game',
    description:
      'Lumen was a game-jam entry: a two-player puzzle game where beams of light power doors. The sprite engine and first level work; levels 2–4, sound and scoring remain. Stopped because interest moved on once judging ended — it sits at 35%.',
    reason: 'lost',
    reasonNote: 'The jam ended and the itch went with it',
    status: 'stopped',
    completion: 35,
    done: ['Sprite engine', 'Level 1'],
    remaining: ['Levels 2–4', 'Sound', 'Scoring'],
    notes: 'Could become a mini-game inside something else.',
    suggestions: [],
    decision: null,
    timeline: [
      { type: 'started', at: now - 20 * DAY_MS },
      { type: 'touched', at: now - 4 * DAY_MS },
      { type: 'closed', at: now - 3 * DAY_MS }
    ],
    createdAt: now - 20 * DAY_MS,
    lastTouchedAt: now - 3 * DAY_MS,
    closedAt: now - 3 * DAY_MS,
    reopenCount: 0
  },
  {
    id: 'seed-blog',
    name: 'Dev Blog',
    goal: 'a small static blog for weekly build logs',
    description:
      'Dev Blog is a static blog with a tiny CMS and four published articles. RSS and comments remain. It was closed when a newsletter idea seemed more promising, then revived a week later by the staleness nudge — now active again at 70%.',
    reason: 'moved',
    reasonNote: 'Newsletter seemed more interesting at the time',
    status: 'active',
    completion: 70,
    done: ['Tiny CMS', 'Four articles', 'Theme'],
    remaining: ['RSS', 'Comments'],
    notes: '',
    suggestions: [],
    decision: 'restart',
    timeline: [
      { type: 'started', at: now - 50 * DAY_MS },
      { type: 'closed', at: now - 20 * DAY_MS },
      { type: 'revisited', at: now - 12 * DAY_MS }
    ],
    createdAt: now - 50 * DAY_MS,
    lastTouchedAt: now - 1 * DAY_MS,
    closedAt: now - 20 * DAY_MS,
    reopenCount: 1
  },
  {
    id: 'seed-expense',
    name: 'Expense Tracker',
    goal: 'a no-login expense tracker for hostel life',
    description:
      'Expense Tracker logs spending with categories and a monthly summary. Entry and charts work; export and budgets remain. Stopped for lack of time — 45%, untouched for twelve days.',
    reason: 'time',
    reasonNote: 'Mid-semester crunch',
    status: 'archived',
    completion: 45,
    done: ['Entry form', 'Monthly charts'],
    remaining: ['CSV export', 'Budgets'],
    notes: '',
    suggestions: [],
    decision: 'archive',
    timeline: [
      { type: 'started', at: now - 60 * DAY_MS },
      { type: 'closed', at: now - 12 * DAY_MS },
      { type: 'decision', at: now - 10 * DAY_MS }
    ],
    createdAt: now - 60 * DAY_MS,
    lastTouchedAt: now - 12 * DAY_MS,
    closedAt: now - 12 * DAY_MS,
    reopenCount: 0
  }
];

/** Load the archive from localStorage (seed on first run). */
export function loadProjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch {
    /* corrupt storage — fall through to seed */
  }
  return SEED;
}

export function saveProjects(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* storage full/blocked — the session still works in memory */
  }
}

/** Create a project from a completed closure flow. */
export function makeProject({ name, goal, done, remaining, reason, reasonNote, completion, description }) {
  const ts = Date.now();
  return {
    id: uid(),
    name,
    goal,
    description,
    reason,
    reasonNote: reasonNote || '',
    status: 'stopped',
    completion,
    done,
    remaining,
    notes: '',
    suggestions: [],
    decision: null,
    timeline: [
      { type: 'started', at: ts },
      { type: 'closed', at: ts }
    ],
    createdAt: ts,
    lastTouchedAt: ts,
    closedAt: ts,
    reopenCount: 0
  };
}

const TIMELINE_TITLES = {
  started: 'Started',
  milestone: 'Milestone',
  touched: 'Last touched',
  closed: 'Closed',
  revisited: 'Revisited',
  decision: 'Decision recorded'
};

export const timelineTitle = (type) => TIMELINE_TITLES[type] || type;

/** Export the context card as Markdown (README export / copy-as-markdown). */
export function toMarkdown(p) {
  const lines = [
    `# ${p.name}`,
    '',
    `> ${p.description}`,
    '',
    `- **Goal:** ${p.goal}`,
    `- **Status:** ${p.status}`,
    `- **Completion:** ${p.completion}%`,
    `- **Stop reason:** ${reasonLabel(p.reason)}${p.reasonNote ? ` — ${p.reasonNote}` : ''}`,
    '',
    '## Done',
    ...(p.done?.length ? p.done.map((d) => `- [x] ${d}`) : ['- none recorded']),
    '',
    '## Remaining',
    ...(p.remaining?.length ? p.remaining.map((d) => `- [ ] ${d}`) : ['- none recorded'])
  ];
  if (p.suggestions?.filter((s) => s.kept).length) {
    lines.push('', '## Saved suggestions');
    p.suggestions.filter((s) => s.kept).forEach((s) => lines.push(`- **${s.action}:** ${s.text}`));
  }
  lines.push('', '---', 'Exported from Shelved — context preserved at the moment of closure.');
  return lines.join('\n');
}
