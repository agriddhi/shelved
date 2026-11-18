// components/CompletionRing/CompletionRing.jsx
// Semicircle gauge — the arc fills proportionally to `percentage`.
import { useId } from 'react';

export default function CompletionRing({ percentage = 0, size = 160, theme = 'dark' }) {
  const pct = Math.max(0, Math.min(100, percentage));
  const id = useId();
  const [track, start] = theme === 'light' ? ['#ecdcc9', 'var(--accent-2)'] : ['var(--surface-2)', 'var(--accent-2)'];
  const circumference = Math.PI * 50; // half circle, r = 50
  const filled = (pct / 100) * circumference;

  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 120 70" role="img" aria-label={`${pct}% complete`}>
      <path d="M 10 62 A 50 50 0 0 1 110 62" fill="none" stroke={track} strokeWidth="14" strokeLinecap="round" opacity="0.9" />
      <path
        d="M 10 62 A 50 50 0 0 1 110 62"
        fill="none"
        stroke={start}
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circumference}`}
        strokeDashoffset="0"
        style={{ transition: 'stroke-dasharray .6s cubic-bezier(.2,.75,.3,1)' }}
      />
      <defs>
        <circle id={id} r="1" fill="transparent" />
      </defs>
    </svg>
  );
}
