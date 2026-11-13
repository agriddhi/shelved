import { daysIdle, reasonLabel, REASONS } from '../lib/store.js';

function Stat({ value, label, hot }) {
  return (
    <div className="panel" style={{ padding: '16px 18px' }}>
      <div
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: 30,
          fontWeight: 700,
          color: hot ? 'var(--accent)' : 'var(--text)'
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 10.5, letterSpacing: 1.4, color: 'var(--muted)', textTransform: 'uppercase' }}>
        {label}
      </div>
    </div>
  );
}

/** Horizontal bar chart — pure divs, no chart lib. */
function Bars({ rows, total }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div style={{ display: 'grid', gap: 13 }}>
      {rows.map((r) => (
        <div key={r.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, marginBottom: 5 }}>
            <span style={{ color: 'var(--body)', fontWeight: 600 }}>{r.label}</span>
            <span style={{ color: 'var(--muted)', fontWeight: 700 }}>
              {r.value}
              {total ? ` · ${Math.round((r.value / total) * 100)}%` : ''}
            </span>
          </div>
          <div
            style={{
              height: 12,
              borderRadius: 8,
              background: 'var(--surface-2)',
              overflow: 'hidden',
              border: '1px solid var(--border)'
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${(r.value / max) * 100}%`,
                background: r.color || 'var(--accent)',
                borderRadius: 8,
                transition: 'width .4s ease'
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Completion distribution — stacked band. */
function Bands({ buckets }) {
  const total = buckets.reduce((s, b) => s + b.value, 0) || 1;
  return (
    <div>
      <div style={{ display: 'flex', height: 26, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
        {buckets.map((b) =>
          b.value > 0 ? (
            <div
              key={b.label}
              title={`${b.label}: ${b.value}`}
              style={{ width: `${(b.value / total) * 100}%`, background: b.color }}
            />
          ) : null
        )}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 12 }}>
        {buckets.map((b) => (
          <span key={b.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--muted)' }}>
            <span style={{ width: 11, height: 11, borderRadius: 3, background: b.color, border: '1px solid rgba(41,0,68,.3)' }} />
            {b.label} — <strong style={{ color: 'var(--body)' }}>{b.value}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard({ projects, navigate }) {
  const n = projects.length;
  const revived = projects.filter((p) => (p.reopenCount || 0) > 0);
  const archived = projects.filter((p) => p.status === 'archived');
  const stopped = projects.filter((p) => p.status === 'stopped');
  const active = projects.filter((p) => p.status === 'active');
  const idleList = projects.filter((p) => p.status !== 'active');
  const avgIdle = idleList.length ? Math.round(idleList.reduce((s, p) => s + daysIdle(p), 0) / idleList.length) : 0;
  const avgCompletion = n ? Math.round(projects.reduce((s, p) => s + (p.completion || 0), 0) / n) : 0;

  // ── "why you really stop" — data-derived insights ──────────────────
  const insights = [];
  if (n > 0) {
    const reasonCounts = {};
    idleList.forEach((p) => {
      reasonCounts[p.reason] = (reasonCounts[p.reason] || 0) + 1;
    });
    const top = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0];
    if (top) {
      const [key, count] = top;
      const pct = Math.round((count / idleList.length) * 100);
      insights.push({
        k: 'PATTERN',
        title: `${pct}% of your shelf stops the same way`,
        body: `${count} of ${idleList.length} paused/archived projects closed as “${reasonLabel(key)}”. That pattern is what to design against next time.`
      });
    }
    const high = projects.filter((p) => p.completion >= 70);
    const highRevived = high.filter((p) => (p.reopenCount || 0) > 0).length;
    insights.push({
      k: 'FINISHING',
      title: `${high.length} of ${n} projects are past the finish line`,
      body: high.length
        ? `Anything ≥70% complete is closer to restart than rewrite — ${highRevived} of them were already picked up again. Finish beats fresh.`
        : 'No projects past 70% yet — your closures are happening too early, before the payoff zone.'
    });
    const complexProjects = projects.filter((p) => p.reason === 'complex');
    if (complexProjects.length) {
      const avg = Math.round(complexProjects.reduce((s, p) => s + (p.completion || 0), 0) / complexProjects.length);
      insights.push({
        k: 'SCOPE WALLS',
        title: `The “too complex” walls average ${avg}% done`,
        body: 'You are hitting scope walls, not effort walls. Cut the scope until it fits your time — every “complex” closure could have been a Simplify closure.'
      });
    }
    const stale = stopped.filter((p) => daysIdle(p) >= 30).length;
    if (stale) {
      insights.push({
        k: 'DUST',
        title: `${stale} project${stale === 1 ? '' : 's'} went cold past 30 days`,
        body: 'Past a month untouched, willpower stops working — that is why the staleness nudge exists. Decide it now, or let it go with a reason.'
      });
    }
  }

  const reasonRows = REASONS.map((r) => ({
    label: r.label,
    value: projects.filter((p) => p.reason === r.key).length,
    color: r.color
  })).filter((r) => r.value > 0);

  const statusRows = [
    { label: 'Stopped — awaiting a decision', value: stopped.length, color: '#8A2A78' },
    { label: 'Active', value: active.length, color: '#E3EF4F' },
    { label: 'Archived', value: archived.length, color: '#5882E8' }
  ].filter((r) => r.value > 0);

  const buckets = [
    { label: '0–33%', value: projects.filter((p) => p.completion <= 33).length, color: '#F4ACB7' },
    { label: '34–66%', value: projects.filter((p) => p.completion > 33 && p.completion <= 66).length, color: '#FFCAD4' },
    { label: '67–99%', value: projects.filter((p) => p.completion > 66 && p.completion < 100).length, color: '#EEE3B0' },
    { label: '100%', value: projects.filter((p) => p.completion >= 100).length, color: '#D8E2DC' }
  ];

  const longestIdle = [...idleList].sort((a, b) => daysIdle(b) - daysIdle(a))[0];

  return (
    <div>
      <p style={{ fontSize: 11.5, letterSpacing: 3.2, color: 'var(--accent)', fontWeight: 700, margin: 0 }}>
        IMPACT DASHBOARD
      </p>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 34, color: 'var(--text)', margin: '8px 0 4px' }}>
        Your shelf, in numbers.
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: 15, margin: '0 0 22px' }}>
        What closure actually gives you: context preserved, decisions recorded, projects revived.
      </p>

      {/* stat row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 26 }}>
        <Stat value={n} label="Context cards" />
        <Stat value={revived.length} label="Revived" hot />
        <Stat value={archived.length} label="Archived" />
        <Stat value={`${avgIdle}d`} label="Avg idle" />
        <Stat value={`${avgCompletion}%`} label="Avg done" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 22 }}>
        {/* reasons */}
        <div className="panel" style={{ padding: '22px 24px' }}>
          <p style={{ fontSize: 11, letterSpacing: 2.6, color: 'var(--accent)', fontWeight: 700, margin: '0 0 16px' }}>
            WHY PROJECTS STOPPED
          </p>
          {reasonRows.length ? (
            <Bars rows={reasonRows} total={n} />
          ) : (
            <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>No closures recorded yet.</p>
          )}
        </div>

        {/* status */}
        <div className="panel" style={{ padding: '22px 24px' }}>
          <p style={{ fontSize: 11, letterSpacing: 2.6, color: 'var(--accent)', fontWeight: 700, margin: '0 0 16px' }}>
            WHERE THEY STAND NOW
          </p>
          <Bars rows={statusRows} total={n} />
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 18, paddingTop: 16 }}>
            <p style={{ fontSize: 11, letterSpacing: 2.6, color: 'var(--accent)', fontWeight: 700, margin: '0 0 12px' }}>
              COMPLETION SPREAD
            </p>
            <Bands buckets={buckets} />
          </div>
        </div>
      </div>

      {/* why you really stop */}
      {insights.length > 0 && (
        <div
          className="panel fade-up"
          style={{
            '--d': '0.18s',
            padding: '22px 24px',
            marginBottom: 22,
            border: '1px solid var(--accent-2)'
          }}
        >
          <p style={{ fontSize: 11, letterSpacing: 2.6, color: 'var(--accent)', fontWeight: 700, margin: '0 0 14px' }}>
            WHAT YOUR SHELF TOLD ME
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 22 }}>
            {insights.map((i) => (
              <div key={i.k}>
                <p style={{ fontSize: 10, letterSpacing: 2, color: 'var(--accent-2)', fontWeight: 700, margin: '0 0 5px' }}>
                  {i.k}
                </p>
                <p
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: 16,
                    fontWeight: 700,
                    color: 'var(--text)',
                    lineHeight: 1.35,
                    margin: '0 0 6px'
                  }}
                >
                  {i.title}
                </p>
                <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.55, margin: 0 }}>{i.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* nudge + highlight */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
        <div className="panel" style={{ padding: '22px 24px', border: '1px solid var(--accent-2)' }}>
          <p style={{ fontSize: 11, letterSpacing: 2.6, color: 'var(--accent)', fontWeight: 700, margin: '0 0 10px' }}>
            LONGEST WAITING
          </p>
          {longestIdle ? (
            <>
              <p style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: 'var(--text)', margin: '0 0 6px' }}>
                {longestIdle.name} — {daysIdle(longestIdle)} days idle
              </p>
              <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 16px' }}>
                {reasonLabel(longestIdle.reason)} · {longestIdle.completion}% complete ·{' '}
                {longestIdle.remaining?.length || 0} items left. Decide it now, or reopen it with full context.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="btn-primary"
                  type="button"
                  style={{ padding: '10px 20px', fontSize: 14 }}
                  onClick={() => navigate('decision', longestIdle.id)}
                >
                  Decide now
                </button>
                <button
                  className="btn-quiet"
                  type="button"
                  onClick={() => navigate('profile', longestIdle.id)}
                >
                  Open profile
                </button>
              </div>
            </>
          ) : (
            <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>Everything on the shelf is active.</p>
          )}
        </div>

        <div className="panel" style={{ padding: '22px 24px' }}>
          <p style={{ fontSize: 11, letterSpacing: 2.6, color: 'var(--accent)', fontWeight: 700, margin: '0 0 10px' }}>
            REVIVAL RATE
          </p>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: 44, fontWeight: 700, color: 'var(--accent)', margin: 0 }}>
            {n ? Math.round((revived.length / n) * 100) : 0}%
          </p>
          <p style={{ fontSize: 14, color: 'var(--muted)', margin: '6px 0 0', lineHeight: 1.5 }}>
            {revived.length} of {n} projects came back off the shelf. Context cards make restarting
            cheaper than starting over — that is the whole point.
          </p>
        </div>
      </div>
    </div>
  );
}
