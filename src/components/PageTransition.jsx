// components/PageTransition.jsx — slide stack: deeper screen slides in from the right, going back reverses.
import { useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const DEPTH = { home: 0, archive: 0, dashboard: 0, closure: 1, profile: 1, thinking: 2, decision: 2 };

export function usePageDirection(viewName) {
  const prev = useRef(viewName);
  const dir = useRef(1);
  if (prev.current !== viewName) {
    dir.current = (DEPTH[viewName] ?? 0) >= (DEPTH[prev.current] ?? 0) ? 1 : -1;
    prev.current = viewName;
  }
  return dir.current;
}

const variants = {
  enter: (d) => ({ x: d * 48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d) => ({ x: d * -48, opacity: 0 })
};

export default function PageTransition({ viewKey, direction, children }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence mode="popLayout" custom={direction} initial={false}>
      <motion.div
        key={viewKey}
        className="page"
        custom={direction}
        variants={reduce ? undefined : variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ type: 'spring', stiffness: 380, damping: 36 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
