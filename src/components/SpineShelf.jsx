// components/SpineShelf.jsx — keyboard-navigable shelf; vertical list + swipe actions on phones.
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import { motion, useAnimate } from 'framer-motion';
import Spine from './Spine.jsx';
import { useMedia } from '../hooks/hooks.js';

function SwipeRow({ enabled, actions, children }) {
  const [scope, animate] = useAnimate();
  if (!enabled) return children;
  const snap = (info) =>
    animate(
      scope.current,
      { x: info.offset.x < -70 || info.velocity.x < -400 ? -168 : 0 },
      { type: 'spring', stiffness: 500, damping: 40 }
    );
  return (
    <div className="swipe">
      <div className="swipe__actions">{actions}</div>
      <motion.div
        ref={scope}
        className="swipe__front"
        drag="x"
        dragConstraints={{ left: -168, right: 0 }}
        dragElastic={0.1}
        onDragEnd={(_, info) => snap(info)}
      >
        {children}
      </motion.div>
    </div>
  );
}

const SpineShelf = forwardRef(function SpineShelf(
  { projects, onOpen, onAction, shelvingId, revivingId, thudKey },
  ref
) {
  const mobile = useMedia('(max-width: 640px)');
  const els = useRef([]);
  const [focus, setFocus] = useState(0);
  const [thud, setThud] = useState(false);
  const f = Math.min(focus, Math.max(0, projects.length - 1));

  const go = useCallback(
    (i) => {
      if (!projects.length) return;
      const n = Math.max(0, Math.min(projects.length - 1, i));
      setFocus(n);
      const el = els.current[n];
      el?.focus();
      el?.scrollIntoView({
        block: 'nearest',
        inline: 'center',
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
      });
    },
    [projects.length]
  );
  useImperativeHandle(ref, () => ({ jump: go }), [go]);

  useEffect(() => {
    // soft thud when a book lands
    if (!thudKey) return undefined;
    setThud(true);
    const id = setTimeout(() => setThud(false), 320);
    return () => clearTimeout(id);
  }, [thudKey]);

  const onKey = (e, i) => {
    const k = e.key;
    if (k === 'ArrowRight' || k === 'ArrowDown') {
      e.preventDefault();
      go(i + 1);
    } else if (k === 'ArrowLeft' || k === 'ArrowUp') {
      e.preventDefault();
      go(i - 1);
    } else if (k === 'Home') {
      e.preventDefault();
      go(0);
    } else if (k === 'End') {
      e.preventDefault();
      go(projects.length - 1);
    }
  };

  if (!projects.length) {
    return (
      <p className="shelf-empty">
        Nothing on the shelf yet. Every finished project started as an unfinished one.
      </p>
    );
  }
  return (
    <div className={`shelf-wrap${thud ? ' shelf-wrap--thud' : ''}`}>
      <ul className="shelf" role="list" aria-label="Your shelved projects">
        {projects.map((p, i) => (
          <li key={p.id} className="spine-slot" style={{ '--i': i }}>
            <SwipeRow
              enabled={mobile}
              actions={
                <>
                  <button type="button" onClick={() => onAction?.('restart', p)}>
                    Restart
                  </button>
                  <button type="button" onClick={() => onAction?.('archive', p)}>
                    Archive
                  </button>
                </>
              }
            >
              <Spine
                ref={(el) => {
                  els.current[i] = el;
                }}
                project={p}
                index={i}
                focused={i === f}
                incoming={shelvingId === p.id}
                reviving={revivingId === p.id}
                onOpen={onOpen}
                onKey={onKey}
                onFocus={setFocus}
              />
            </SwipeRow>
          </li>
        ))}
      </ul>
      <div className="shelf-board" aria-hidden="true" />
    </div>
  );
});
export default SpineShelf;
