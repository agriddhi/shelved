// hooks/hooks.js — small, dependency-free hooks (adapted to Shelved's fields)
import { useEffect, useMemo, useRef, useState } from 'react';
import { tick, haptic } from '../lib/fx';
import { sameReasonCount } from '../lib/idle.js';

export function useMedia(query) {
  const [m, setM] = useState(() => (typeof matchMedia !== 'undefined' ? matchMedia(query).matches : false));
  useEffect(() => {
    const mq = matchMedia(query);
    const f = () => setM(mq.matches);
    mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, [query]);
  return m;
}

// N new · A archive · D dashboard · 1-9 jump · Esc home · ? help. Ignored while typing.
export function useShortcuts(handlers) {
  const ref = useRef(handlers);
  ref.current = handlers;
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (t?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t?.tagName)) return;
      const h = ref.current, k = e.key;
      if (k === 'Escape') return h.onHome?.();
      if (k === '?') { e.preventDefault(); return h.onHelp?.(); }
      if (/^[1-9]$/.test(k)) return h.onJump?.(Number(k) - 1);
      const fn = { n: h.onNew, a: h.onArchive, d: h.onDashboard }[k.toLowerCase()];
      if (fn) { e.preventDefault(); fn(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

// 3D tilt toward the cursor via CSS vars (composes with hover transforms).
// <button className="tilt" {...tilt.handlers} style={{ '--tilt': '-2deg' }}>
export function useTilt(max = 7) {
  const ref = useRef(null);
  const onMouseMove = (e) => {
    const el = ref.current;
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--ry', `${(px * max).toFixed(2)}deg`);
    el.style.setProperty('--rx', `${(-py * max).toFixed(2)}deg`);
  };
  const onMouseLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };
  return { ref, handlers: { onMouseMove, onMouseLeave } };
}

// Tick every 400ms while a hold is active (desktop tone if sound is on, haptic on mobile)
export function useHoldTicks(active) {
  useEffect(() => {
    if (!active) return undefined;
    tick(); haptic(8);
    const id = setInterval(() => { tick(); haptic(8); }, 400);
    return () => clearInterval(id);
  }, [active]);
}

// Placeholder that cycles through the user's real project titles
export function useRotatingPlaceholder(titles = [], ms = 3200) {
  const key = titles.join('|');
  const pool = useMemo(() => {
    const own = titles.filter(Boolean).slice(0, 6).map((t) => `e.g. ${t}`);
    return own.length ? own : ['e.g. ML Notes Search', 'e.g. Weekend Game Jam', 'e.g. Recipe Tracker'];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const [i, setI] = useState(0);
  useEffect(() => {
    if (pool.length < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const id = setInterval(() => setI((n) => (n + 1) % pool.length), ms);
    return () => clearInterval(id);
  }, [pool, ms]);
  return pool[i % pool.length];
}

// Recent-search pills for the Archive
export function useRecentSearches(max = 5) {
  const KEY = 'shelved.recentSearches';
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY)) ?? []; } catch { return []; }
  });
  const save = (next) => { try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ } return next; };
  return {
    items,
    add: (q) => { q = q.trim(); if (q) setItems((p) => save([q, ...p.filter((x) => x !== q)].slice(0, max))); },
    clear: () => setItems(save([])),
  };
}

// Multi-select for "Spring cleaning" batch mode
export function useSelection() {
  const [sel, setSel] = useState(() => new Set());
  return {
    sel, count: sel.size, has: (id) => sel.has(id), clear: () => setSel(new Set()),
    toggle: (id) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; }),
    set: (ids) => setSel(new Set(ids)),
  };
}

// Convenience: "N others shelved for the same reason"
export function useSameReasonCount(project, all) {
  return useMemo(() => sameReasonCount(project, all), [project, all]);
}
