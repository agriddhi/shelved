// components/Spine.jsx — one book on the shelf: dust, tooltip, revive glow, a11y.
import { forwardRef, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { idleDays, dustLevel, touchedLabel } from '../lib/idle.js';
import { useMedia } from '../hooks/hooks.js';

// Stable pick of one of the 5 spine slots per project
export const spineSlot = (p) =>
  [...`${p.id}${p.name}`].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 997, 7) % 5;

function Puff() {
  const motes = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        t: 4 + Math.random() * 40,
        s: 2 + Math.random() * 3,
        x: 30 + Math.random() * 90,
        y: -40 + Math.random() * 50,
        d: Math.random() * 0.3
      })),
    []
  );
  return (
    <span className="spine__puff" aria-hidden="true">
      {motes.map((m) => (
        <motion.i
          key={m.id}
          className="spine__mote"
          style={{ top: `${m.t}%`, width: m.s, height: m.s }}
          initial={{ x: 0, y: 0, opacity: 0.95 }}
          animate={{ x: m.x, y: m.y, opacity: 0 }}
          transition={{ duration: 0.9, delay: m.d, ease: 'easeOut' }}
        />
      ))}
    </span>
  );
}

const Spine = forwardRef(function Spine(
  { project, index, focused, incoming, reviving, onOpen, onKey, onFocus },
  ref
) {
  const reduce = useReducedMotion();
  const mobile = useMedia('(max-width: 640px)');
  const days = idleDays(project);
  const dust = reviving ? 0 : dustLevel(days);
  const n = spineSlot(project);
  const pct = project.completion ?? 0;
  const height = 150 + Math.round(pct * 0.9); // fuller projects → taller books
  const label = `${project.name}. ${pct}% complete. ${touchedLabel(days)}. Press Enter to open.`;
  const lift = reduce || mobile ? undefined : { y: -14, rotateZ: [0, -2, 1.5, -1, 0] };

  return (
    <motion.button
      ref={ref}
      type="button"
      className={`spine${reviving ? ' spine--revive' : ''}`}
      data-spine-id={project.id}
      style={{
        '--c': `var(--spine-${n})`,
        '--fg': `var(--spine-${n}-fg)`,
        '--dust': String(dust),
        '--ph': `${height}px`,
        visibility: incoming ? 'hidden' : 'visible'
      }}
      tabIndex={focused ? 0 : -1} // roving tabindex
      aria-label={label}
      onClick={() => onOpen(project)}
      onKeyDown={(e) => onKey(e, index)}
      onFocus={() => onFocus(index)}
      whileHover={lift}
      whileFocus={lift}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 380, damping: 11, mass: 0.8 }}
    >
      <span className="spine__title">{project.name}</span>
      <span className="spine__pct" aria-hidden="true">
        {pct}%
      </span>
      <span className="spine__idle" aria-hidden="true">
        {days}d idle
      </span>
      <span className="spine__dust" aria-hidden="true" />
      {reviving && <Puff />}
      <span className="spine__tip" aria-hidden="true">
        {touchedLabel(days)}
      </span>
    </motion.button>
  );
});
export default Spine;
