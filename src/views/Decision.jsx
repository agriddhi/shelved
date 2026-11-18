import { recommend } from '../lib/recommender.js';
import { REASONS, daysIdle, reasonLabel } from '../lib/store.js';
import { DecisionTrail } from '../components/Extras.jsx';
import { burst } from '../lib/fx.js';

// Ribbon badge for top pick
const Ribbon = () => (
  <div className="ribbon">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
    TOP PICK
  </div>
);

export default function Decision({ project: p, upsert, navigate, notify }) {
  const days = daysIdle(p);
  const ranked = recommend({ reason: p.reason, completion: p.completion, days });
  const reason = REASONS.find((r) => r.key === p.reason);

  const apply = (opt) => {
    const now = Date.now();
    const status = opt.key === 'archive' ? 'archived' : 'active';
    const wasActive = p.status === 'active';
    const decision = opt.key;
    upsert({
      ...p,
      status,
      decision,
      lastTouchedAt: now,
      reopenCount: (p.reopenCount || 0) + (status === 'active' && !wasActive ? 1 : 0),
      timeline: [
        ...(p.timeline || []),
        { type: 'decision', at: now, option: decision },
        ...(status === 'active' && !wasActive ? [{ type: 'revisited', at: now }] : [])
      ]
    });
    burst();
    notify(`Decision recorded: ${opt.label} ✓`);
    navigate('profile', p.id);
  };

  return (
    <div style={{ maxWidth: 860 }}>
      <button className="btn-quiet" type="button" onClick={() => navigate('profile', p.id)} style={{ marginBottom: 18 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}><path d="m15 18-6-6 6-6"/></svg>
        Back to {p.name}
      </button>

      <p style={{ fontSize: 11, letterSpacing: 3.2, color: 'var(--accent)', fontWeight: 700, margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>
        DECISION ENGINE
      </p>
      <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 36, color: 'var(--text)', margin: '12px 0 6px', letterSpacing: '-0.03em' }}>
        What should happen to {p.name}?
      </h1>
      <DecisionTrail
        history={(p.timeline || [])
          .filter((e) => e.type === 'decision' && e.option)
          .map((e) => e.option)
          .slice(-2)}
      />
      <p style={{ color: 'var(--muted)', fontSize: 16, margin: '0 0 16px', lineHeight: 1.6 }}>
        Five options, ranked by a deterministic rule — not a coin flip.
      </p>

      {/* inputs to the engine */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
        <span className="tag-pill" style={{ ['--tag-color']: reason?.color || 'var(--surface-hover)' }}>
          {reasonLabel(p.reason)}
        </span>
        <span className="tag-pill" style={{ ['--tag-color']: 'var(--accent-2)' }}>
          {p.completion}% complete
        </span>
        <span className="tag-pill" style={{ ['--tag-color']: 'var(--accent)' }}>
          idle {days}d
        </span>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        {ranked.map((opt, i) => {
          const top = i === 0;
          return (
            <div
              key={opt.key}
              className="panel"
              style={{
                padding: '22px 28px',
                display: 'flex',
                gap: 20,
                alignItems: 'flex-start',
                border: top ? '2px solid var(--accent)' : '1px solid var(--border)',
                borderLeft: top ? '4px solid var(--accent)' : '1px solid var(--border)',
                background: top ? 'var(--surface-2)' : 'var(--surface)',
                position: 'relative',
                transition: 'all 0.2s ease'
              }}
            >
              {top && <Ribbon />}
              <div
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 28,
                  fontWeight: 700,
                  color: top ? 'var(--accent)' : 'var(--muted)',
                  minWidth: 44,
                  textAlign: 'center',
                  lineHeight: 1
                }}
              >
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{opt.label}</span>
                  <span
                    style={{
                      fontSize: 11,
                      color: 'var(--muted)',
                      fontFamily: "'JetBrains Mono', monospace",
                      letterSpacing: 1
                    }}
                  >
                    score {opt.score}
                  </span>
                </div>
                <p style={{ fontSize: 14, color: 'var(--muted)', margin: '4px 0 10px', lineHeight: 1.55 }}>{opt.hint}</p>
                {/* score bar */}
                <div style={{ height: 4, borderRadius: 2, background: 'var(--surface-2)', overflow: 'hidden', marginBottom: 12, border: '1px solid var(--border)' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.max(5, (opt.score / 5) * 100)}%`,
                      background: top ? 'var(--accent)' : 'var(--accent-2)',
                      borderRadius: 2,
                      transition: 'width 0.5s ease'
                    }}
                  />
                </div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {opt.reasons.map((r) => (
                    <li key={r} style={{ fontSize: 13.5, color: 'var(--body)', lineHeight: 1.6, padding: '2px 0' }}>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                className={top ? 'btn-primary' : 'btn-ghost'}
                type="button"
                style={{ padding: '11px 22px', fontSize: 14, flexShrink: 0, marginTop: 4 }}
                onClick={() => apply(opt)}
              >
                Choose {opt.label}
              </button>
            </div>
          );
        })}
      </div>

      {/* info callout */}
      <div
        className="panel"
        style={{
          marginTop: 20,
          padding: '16px 24px',
          borderLeft: '3px solid var(--accent-2)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
          <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
        </svg>
        <p style={{ fontSize: 13.5, color: 'var(--body)', lineHeight: 1.6, margin: 0 }}>
          <strong style={{ color: 'var(--text)' }}>Ranking logic:</strong> stop reason + completion + days idle → fixed score table. Same inputs always
          produce the same ranking — verifiable, testable, offline-safe.
        </p>
      </div>
    </div>
  );
}
