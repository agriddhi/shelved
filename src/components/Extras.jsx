// components/Extras.jsx — toasts with Undo, draft banner, lazy mount, liquid progress,
// AI-thinking skeleton, idle chip, decision trail, streak badge, shortcuts modal.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { readStreak } from '../lib/store.js';

/* ── Toast stack with Undo (fits "nothing is ever deleted") ─────────────── */
const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((msg, { ms = 3200, action } = {}) => {
    const id = Math.random().toString(36).slice(2);
    setItems((a) => [...a.slice(-2), { id, msg, action }]);
    setTimeout(() => setItems((a) => a.filter((t) => t.id !== id)), ms);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        <AnimatePresence initial={false}>
          {items.map((t) => (
            <motion.div
              key={t.id}
              layout
              className="toast"
              initial={{ y: 40, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', stiffness: 520, damping: 22 }}
            >
              <span>{t.msg}</span>
              {t.action && (
                <button type="button" onClick={t.action.run}>
                  {t.action.label}
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

/* ── "You were closing …" recovery banner (reads the draft ClosureFlow keeps) ── */
export function DraftBanner({ storageKey = 'shelved.draft', onResume }) {
  const draft = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem(storageKey));
    } catch {
      return null;
    }
  }, [storageKey]);
  const [hidden, setHidden] = useState(false);
  if (!draft || hidden || !Object.keys(draft).length) return null;
  const name = draft.name || 'Untitled Project';
  return (
    <motion.div
      className="draft-banner"
      role="region"
      aria-label="Unfinished closure"
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <span>You were closing “{name}”.</span>
      <button type="button" onClick={onResume}>
        Resume
      </button>
      <button
        type="button"
        onClick={() => {
          try {
            sessionStorage.removeItem(storageKey);
          } catch {
            /* ignore */
          }
          setHidden(true);
        }}
      >
        Discard
      </button>
    </motion.div>
  );
}

/* ── Render cards only when they near the viewport ───────────────────────── */
export function LazyMount({ children, height = 190, rootMargin = '300px' }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (on || !ref.current) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { rootMargin }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [on, rootMargin]);
  return <div ref={ref} style={on ? undefined : { minHeight: height }}>{on ? children : null}</div>;
}

/* ── Closure-flow progress as a liquid shimmer fill. value: 0..1 ─────────── */
export function LiquidProgress({ value, label = 'Closure progress' }) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <div
      className="liquid"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v * 100)}
    >
      <div className="liquid__fill" style={{ transform: `scaleX(${v})` }} />
    </div>
  );
}

/* ── Step 4 while the AI drafts ──────────────────────────────────────────── */
export function AiThinking({ text = 'AI is reading your answers…' }) {
  return (
    <div className="ai-think" role="status" aria-live="polite" aria-busy="true">
      <p>
        {text}
        <span className="dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </p>
      <div className="skeleton" style={{ width: '100%' }} />
      <div className="skeleton" style={{ width: '85%' }} />
      <div className="skeleton" style={{ width: '60%' }} />
      <div className="skeleton" style={{ width: '40%' }} />
    </div>
  );
}

/* ── Idle chip: colour + text, hidden under a week ───────────────────────── */
const idleSpec = (days) => {
  if (days < 7) return null;
  if (days < 30) return { bg: '#FFD166', fg: '#1a1520' };
  if (days < 90) return { bg: '#FF9F1C', fg: '#1a1520' };
  return { bg: '#E63946', fg: '#ffffff' };
};

export function IdleChip({ days }) {
  const s = idleSpec(days);
  if (!s) return null;
  return (
    <span className="idle" title={`Last touched ${days} days ago`}>
      <span className="idle__dot" style={{ background: s.bg }} aria-hidden="true" />
      <span style={{ background: s.bg, color: s.fg, borderRadius: 8, padding: '0 6px' }}>
        {days}d
      </span>
    </span>
  );
}

/* ── Previously: restart → archive → ? ───────────────────────────────────── */
export function DecisionTrail({ history = [] }) {
  if (!history.length) return null;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  return <p className="trail">Previously: {history.map(cap).join(' → ')} → ?</p>;
}

/* ── "12 days of honest endings" ─────────────────────────────────────────── */
export function StreakBadge() {
  const reduce = useReducedMotion();
  const { current } = readStreak();
  if (!current) return null;
  return (
    <p className="streak" aria-live="polite">
      <motion.span
        key={current}
        initial={reduce ? false : { scale: 1.6, opacity: 0.4 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 18 }}
        style={{ display: 'inline-block', marginRight: 6 }}
      >
        🔥 {current}
      </motion.span>
      {current === 1 ? 'day of honest endings' : 'days of honest endings'}
    </p>
  );
}

/* ── ? cheat sheet ───────────────────────────────────────────────────────── */
const ROWS = [
  ['N', 'New closure'],
  ['A', 'Archive'],
  ['D', 'Dashboard'],
  ['1–9', 'Jump to a spine'],
  ['← →', 'Move along the shelf'],
  ['Enter', 'Open the focused spine'],
  ['Esc', 'Back to home'],
  ['?', 'This cheat sheet']
];

export function ShortcutsModal({ open, onClose }) {
  const closeRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.activeElement;
    closeRef.current?.focus();
    return () => prev?.focus?.();
  }, [open]);
  if (!open) return null;
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sc-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            onClose();
          }
          if (e.key === 'Tab') {
            e.preventDefault();
            closeRef.current?.focus();
          }
        }}
      >
        <h2 id="sc-title">Keyboard shortcuts</h2>
        <dl>
          {ROWS.map(([k, d]) => (
            <div key={k}>
              <dt>
                <kbd>{k}</kbd>
              </dt>
              <dd>{d}</dd>
            </div>
          ))}
        </dl>
        <button ref={closeRef} type="button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
