// components/Tooltip.jsx — single portal tooltip, anchor-relative.
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function Tooltip({ label, children }) {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const show = () => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setPos({ x: r.left + r.width / 2, y: r.top });
    setOpen(true);
  };
  const hide = () => setOpen(false);

  return (
    <span
      ref={ref}
      className="app-tip-host"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {open &&
        createPortal(
          <div role="tooltip" className="app-tooltip" style={{ left: pos.x, top: pos.y }}>
            {label}
          </div>,
          document.body
        )}
    </span>
  );
}
