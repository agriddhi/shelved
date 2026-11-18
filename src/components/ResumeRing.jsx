// components/ResumeRing.jsx — restart-readiness ring, colour-coded, never colour-only.
import { resumeScore } from '../lib/resume.js';
import Tooltip from './Tooltip.jsx';

const colorFor = (score) => (score < 40 ? '#E63946' : score < 75 ? '#FF9F1C' : '#3f9e6a');

export default function ResumeRing({ project, size = 34, showBadge = true }) {
  const { score, missing } = resumeScore(project);
  const r = (size - 4) / 2;
  const c = 2 * Math.PI * r;
  const color = colorFor(score);
  const top = missing
    .slice(0, 2)
    .map((m) => m.label.toLowerCase())
    .join(', ');
  const tip = missing.length === 0 ? `Restart readiness ${score}/100 — complete` : `Score ${score} — missing: ${top}`;

  return (
    <Tooltip label={tip}>
      <span className="resume-ring" role="img" aria-label={`Restart readiness ${score} out of 100`} tabIndex={0}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth="3.5" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c - (score / 100) * c}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.2,.75,.3,1)' }}
          />
        </svg>
        <span aria-hidden="true" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: 'var(--text)' }}>
          {score}
        </span>
        {showBadge && score >= 75 && (
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: -8,
              right: -16,
              fontSize: 8,
              fontWeight: 800,
              letterSpacing: 0.6,
              background: '#3f9e6a',
              color: '#ffffff',
              borderRadius: 8,
              padding: '2px 5px'
            }}
          >
            READY
          </span>
        )}
      </span>
    </Tooltip>
  );
}
