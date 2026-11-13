import { recommend } from '../lib/recommender.js';
import { REASONS, daysIdle, reasonLabel } from '../lib/store.js';

export default function Decision({ project: p, upsert, navigate, notify }) {
  const days = daysIdle(p);
  const ranked = recommend({ reason: p.reason, completion: p.completion, days });
  const reason = REASONS.find((r) => r.key === p.reason);

  const apply = (opt) => {
    const now = Date.now();
    const status = opt.key === 'archive' ? 'archived' : 'active';
    const wasActive = p.status === 'active';
    upsert({
      ...p,
      status,
      decision: opt.key,
      lastTouchedAt: now,
      reopenCount: (p.reopenCount || 0) + (status === 'active' && !wasActive ? 1 : 0),
      timeline: [
        ...(p.timeline || []),
        { type: 'decision', at: now },
        ...(status === 'active' && !wasActive ? [{ type: 'revisited', at: now }] : [])
      ]
    });
    notify(`Decision recorded: ${opt.label} ✓`);
    navigate('profile', p.id);
  };

  return (
    <div style={{ maxWidth: 860 }}>
      <button className="btn-quiet" type="button" onClick={() => navigate('profile', p.id)} style={{ marginBottom: 18 }}>
        ← Back to {p.name}
      </button>

      <p style={{ fontSize: 11.5, letterSpacing: 3, color: 'var(--accent)', fontWeight: 700, margin: 0 }}>
        DECISION ENGINE
      </p>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 32, color: 'var(--text)', margin: '8px 0 4px' }}>
        What should happen to {p.name}?
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: 15, margin: '0 0 8px' }}>
        Five options, ranked by a deterministic rule — not a coin flip.
      </p>

      {/* inputs to the engine */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
        <span className="tag-pill" style={{ ['--tag-color']: reason?.color || '#D8E2DC' }}>
          {reasonLabel(p.reason)}
        </span>
        <span className="tag-pill" style={{ ['--tag-color']: 'var(--accent-2)' }}>
          {p.completion}% complete
        </span>
        <span className="tag-pill" style={{ ['--tag-color']: 'var(--accent)' }}>
          idle {days}d
        </span>
      </div>

      <div style={{ display: 'grid', gap: 14 }}>
        {ranked.map((opt, i) => {
          const top = i === 0;
          return (
            <div
              key={opt.key}
              className="panel"
              style={{
                padding: '18px 24px',
                display: 'flex',
                gap: 18,
                alignItems: 'center',
                border: top ? '2px solid var(--accent)' : '1px solid var(--border)',
                background: top ? 'var(--surface-2)' : 'var(--surface)'
              }}
            >
              <div
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 26,
                  fontWeight: 700,
                  color: top ? 'var(--accent)' : 'var(--muted)',
                  minWidth: 44,
                  textAlign: 'center'
                }}
              >
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 17.5, fontWeight: 700, color: 'var(--text)' }}>{opt.label}</span>
                  {top && (
                    <span className="tag-pill" style={{ ['--tag-color']: 'var(--accent)' }}>
                      TOP PICK
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: 11,
                      color: 'var(--muted)',
                      fontFamily: 'Consolas, monospace',
                      letterSpacing: 1
                    }}
                  >
                    score {opt.score}
                  </span>
                </div>
                <p style={{ fontSize: 13.5, color: 'var(--muted)', margin: '4px 0 0' }}>{opt.hint}</p>
                <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                  {opt.reasons.map((r) => (
                    <li key={r} style={{ fontSize: 13.5, color: 'var(--body)', lineHeight: 1.5, padding: '1.5px 0' }}>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                className={top ? 'btn-primary' : 'btn-ghost'}
                type="button"
                style={{ padding: '11px 22px', fontSize: 14, flexShrink: 0 }}
                onClick={() => apply(opt)}
              >
                Choose {opt.label}
              </button>
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 18, fontStyle: 'italic' }}>
        Ranking logic: stop reason + completion + days idle → fixed score table. Same inputs always
        produce the same ranking — verifiable, testable, offline-safe.
      </p>
    </div>
  );
}
