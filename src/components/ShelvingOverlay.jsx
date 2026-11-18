// components/ShelvingOverlay.jsx — card shrinks, tilts into a spine, drops onto its slot with a thud.
// Measured fixed-position overlay (not layoutId) so it survives the view swap.
import { useEffect, useRef } from 'react';
import { motion, useAnimate, useReducedMotion } from 'framer-motion';
import { spineSlot } from './Spine.jsx';
import { thud, haptic } from '../lib/fx.js';

const soundOn = () => {
  try {
    return localStorage.getItem('shelved.sound') === 'on';
  } catch {
    return false;
  }
};

export const toRect = (el) => {
  if (!el) return { left: 100, top: 100, width: 240, height: 240 };
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
};

function waitForEl(sel, ms = 900) {
  return new Promise((res) => {
    const t0 = performance.now();
    const look = () => {
      const el = document.querySelector(sel);
      if (el) return res(el);
      if (performance.now() - t0 > ms) return res(null);
      requestAnimationFrame(look);
    };
    look();
  });
}

export default function ShelvingOverlay({ project, fromRect: from, onLanded, onDone }) {
  const reduce = useReducedMotion();
  const [scope, animate] = useAnimate();
  const faceRef = useRef(null);
  const n = spineSlot(project);

  useEffect(() => {
    let dead = false;
    (async () => {
      const target = await waitForEl(`[data-spine-id="${project.id}"]`);
      if (dead) return;
      if (!target || reduce) {
        onLanded?.();
        onDone?.();
        return; // reduced motion: no flight, just reveal the spine
      }
      target.scrollIntoView({ block: 'nearest', inline: 'center' });
      await new Promise((r) => requestAnimationFrame(r));
      const to = target.getBoundingClientRect();
      const dx = to.left + to.width / 2 - (from.left + from.width / 2);
      const dy = to.top + to.height / 2 - (from.top + from.height / 2);

      const cardEl = scope.current;
      const faceEl = faceRef.current;
      if (!cardEl) return;

      await animate(cardEl, { scaleX: 0.86, scaleY: 0.86, rotate: -2.5, y: -14 }, {
        duration: 0.28,
        ease: 'easeOut'
      });
      if (faceEl) {
        animate(faceEl, { opacity: 0 }, { duration: 0.3 });
      }
      await animate(cardEl, {
        x: dx,
        y: dy - 36,
        scaleX: to.width / from.width,
        scaleY: to.height / from.height,
        rotateY: -70,
        rotate: 0
      }, { duration: 0.6, ease: [0.65, 0, 0.35, 1] });
      await animate(cardEl, { y: dy }, { type: 'spring', stiffness: 600, damping: 16 });
      if (dead) return;
      if (soundOn()) thud(); // sound is opt-in via the sidebar toggle
      haptic(15);
      onLanded?.();
      await animate(cardEl, { opacity: 0 }, { duration: 0.12 });
      onDone?.();
    })();
    return () => {
      dead = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="shelving-layer" aria-hidden="true">
      <motion.div
        ref={scope}
        className="shelving-card"
        style={{
          left: from.left,
          top: from.top,
          width: from.width,
          height: from.height,
          transformPerspective: 900,
          '--c': `var(--spine-${n})`,
          '--fg': `var(--spine-${n}-fg)`
        }}
      >
        <motion.div ref={faceRef} className="shelving-card__face">
          <strong>{project.name}</strong>
          <span>Shelved</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
