/**
 * idle — idle maths, dust level, colour ramp, time labels, similarity, streaks.
 * Shelved's fields: lastTouchedAt, completion, reason, timeline[].at.
 */
const DAY = 86_400_000;

export function idleDays(p, now = Date.now()) {
  const t = p.lastTouchedAt ?? p.closedAt ?? p.createdAt;
  const ms = new Date(t || now).getTime();
  return Number.isNaN(ms) ? 0 : Math.max(0, Math.floor((now - ms) / DAY));
}

// 0 = clean, 1 = fully dusty (reached at ~90 days idle)
export const dustLevel = (days) => (days < 7 ? 0 : Math.min(1, (days - 7) / 83));

// green @0d → amber @7d → orange @30d → deep red @90d.
// Always pair with text, never colour alone.
export function idleColor(days) {
  if (days < 7) return '#3f9e6a';
  const stops = [
    [7, 48],   // yellow
    [30, 26],  // orange
    [90, 4]    // red
  ];
  let hue = 4;
  for (let i = 0; i < stops.length - 1; i++) {
    const [d0, h0] = stops[i];
    const [d1, h1] = stops[i + 1];
    if (days <= d1) {
      hue = h0 + ((days - d0) / (d1 - d0)) * (h1 - h0);
      break;
    }
  }
  return `hsl(${hue.toFixed(0)} 80% 50%)`;
}

export const touchedLabel = (days) =>
  days === 0 ? 'Touched today' : `Last touched ${days} day${days === 1 ? '' : 's'} ago`;

export function timeAgo(ts, now = Date.now()) {
  const d = Math.floor((now - new Date(ts).getTime()) / DAY);
  if (d <= 0) return 'today';
  if (d === 1) return 'yesterday';
  if (d < 30) return `${d} days ago`;
  const m = Math.floor(d / 30);
  return `${m} month${m === 1 ? '' : 's'} ago`;
}

export const kitLabel = (p) =>
  p.kitDownloadedAt ? `Kit downloaded ${timeAgo(p.kitDownloadedAt)}` : 'Cold-start kit ready';

// Consecutive days (ending today, or yesterday if today is empty) with a closure or decision.
export function streak(timestamps, now = Date.now()) {
  const days = new Set((timestamps || []).map((t) => new Date(t).toDateString()));
  if (days.size === 0) return 0;
  const d = new Date(now);
  if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days.has(d.toDateString())) {
    n += 1;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

/** All closure/decision timestamps across the shelf (for the streak). */
export function shelfTimestamps(projects, now = Date.now()) {
  const out = [];
  for (const p of projects || []) {
    for (const e of p.timeline || []) {
      if (e.type === 'closed' || e.type === 'decision') out.push(e.at);
    }
  }
  return out;
}

// "You also shelved 3 other projects for 'too complex'"
export function similarProjects(p, all, limit = 3) {
  return (all || [])
    .filter((o) => o.id !== p.id)
    .map((o) => ({
      o,
      score: (o.reason === p.reason ? 2 : 0) +
             (Math.abs((o.completion ?? 0) - (p.completion ?? 0)) <= 15 ? 1 : 0)
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.o);
}

export const sameReasonCount = (p, all) =>
  (all || []).filter((o) => o.id !== p.id && o.reason === p.reason).length;
