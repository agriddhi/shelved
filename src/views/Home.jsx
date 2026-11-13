import { useEffect, useRef, useState } from 'react';
import SpineShelf from '../components/SpineShelf/SpineShelf.jsx';
import { CARD_FACES, REASONS, reasonLabel, daysIdle, daysSince } from '../lib/store.js';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

const chip = (color) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: 0.4,
  padding: '3px 10px',
  borderRadius: 30,
  color: '#290044',
  background: color,
  border: '1px solid rgba(41,0,68,.3)'
});

const nightInk = '#290044';
const TILT = [-3, 2, -2, 3, -1.5, 2.5, -2.5];

function useCountUp(target, duration = 1000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function ProjectCard({ p, index, onOpen }) {
  const face = CARD_FACES[index % CARD_FACES.length];
  const idle = daysIdle(p);
  const meta =
    p.status === 'active'
      ? `In progress · touched ${daysSince(p.lastTouchedAt)}d ago`
      : p.status === 'archived'
        ? `Archived · idle ${idle}d`
        : `Paused ${idle}d ago`;
  return (
    <button
      type="button"
      onClick={() => onOpen()}
      className="project-card"
      style={{
        '--tilt': `${TILT[index % TILT.length]}deg`,
        '--d': `${index * 0.07}s`,
        textAlign: 'left',
        background: face,
        color: nightInk,
        border: '2px solid rgba(41,0,68,.35)',
        borderRadius: 16,
        padding: '18px 18px 16px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        width: 242,
        minHeight: 186
      }}
    >
      <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span style={chip(REASONS.find((r) => r.key === p.reason)?.color || '#D8E2DC')}>
          {reasonLabel(p.reason)}
        </span>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(41,0,68,.6)' }}>
          {p.status.toUpperCase()}
        </span>
      </span>
      <span style={{ fontFamily: 'Georgia, serif', fontSize: 19, fontWeight: 700, lineHeight: 1.15 }}>
        {p.name}
      </span>
      <span style={{ fontSize: 12.5, lineHeight: 1.35, color: 'rgba(41,0,68,.75)', flex: 1 }}>
        {p.goal}
      </span>
      <span>
        <span
          style={{
            display: 'block',
            height: 7,
            borderRadius: 6,
            background: 'rgba(41,0,68,.16)',
            overflow: 'hidden',
            marginBottom: 6
          }}
        >
          <span
            className="bar-anim"
            style={{
              display: 'block',
              height: '100%',
              width: `${p.completion}%`,
              background: '#500071',
              borderRadius: 6,
              '--d': `${0.25 + index * 0.07}s`
            }}
          />
        </span>
        <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700 }}>
          <span>{p.completion}% done</span>
          <span style={{ color: 'rgba(41,0,68,.65)' }}>{meta}</span>
        </span>
      </span>
    </button>
  );
}

function Stat({ value, label, hot, index }) {
  const n = useCountUp(typeof value === 'number' ? value : 0, 900 + index * 120);
  return (
    <div className="panel fade-up" style={{ '--d': `${0.08 + index * 0.08}s`, padding: '16px 18px' }}>
      <div
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: 30,
          fontWeight: 700,
          color: hot ? 'var(--accent)' : 'var(--text)'
        }}
      >
        {typeof value === 'number' ? n : value}
      </div>
      <div style={{ fontSize: 10.5, letterSpacing: 1.4, color: 'var(--muted)', textTransform: 'uppercase' }}>
        {label}
      </div>
    </div>
  );
}

export default function Home({ projects, navigate }) {
  const sorted = [...projects].sort((a, b) => (b.lastTouchedAt || 0) - (a.lastTouchedAt || 0));
  const deckProjects = sorted.slice(0, 5);
  const nudged = projects
    .filter((p) => p.status === 'stopped' && daysIdle(p) >= 30)
    .sort((a, b) => daysIdle(b) - daysIdle(a))[0];

  const revived = projects.filter((p) => (p.reopenCount || 0) > 0).length;
  const archived = projects.filter((p) => p.status === 'archived').length;
  const idleList = projects.filter((p) => p.status !== 'active');
  const avgIdle = idleList.length
    ? Math.round(idleList.reduce((s, p) => s + daysIdle(p), 0) / idleList.length)
    : 0;

  // ── spin the shelf ─────────────────────────────────────────
  const stalled = idleList;
  const [spinning, setSpinning] = useState(false);
  const [tick, setTick] = useState(0);
  const [winner, setWinner] = useState(null);
  const spinTimer = useRef(null);
  useEffect(() => () => clearTimeout(spinTimer.current), []);

  const openSpin = () => {
    if (!stalled.length || spinning) return;
    setWinner(null);
    setSpinning(true);
    setTick(0);
    const target = Math.floor(Math.random() * stalled.length);
    const total = stalled.length * 3 + target;
    let i = 0;
    const tickFn = () => {
      i += 1;
      setTick(i);
      if (i >= total) {
        setWinner(stalled[target]);
        setSpinning(false);
        return;
      }
      const p = i / total;
      spinTimer.current = setTimeout(tickFn, 42 + Math.pow(p, 2.6) * 250);
    };
    spinTimer.current = setTimeout(tickFn, 42);
  };
  const currentIndex = spinning && stalled.length ? tick % stalled.length : -1;

  return (
    <div style={{ maxWidth: 1160, margin: '0 auto' }}>
      {/* hero — centred */}
      <div style={{ textAlign: 'center', margin: '6px 0 26px' }}>
        <p
          className="fade-up"
          style={{ fontSize: 11.5, letterSpacing: 3.4, color: 'var(--accent)', fontWeight: 700, margin: 0 }}
        >
          YOUR SHELF
        </p>
        <h1
          className="fade-up"
          style={{
            '--d': '0.05s',
            fontFamily: 'Georgia, serif',
            fontSize: 44,
            lineHeight: 1.1,
            color: 'var(--text)',
            margin: '12px 0 10px'
          }}
        >
          {greeting()}. Give it an<br />honest ending.
        </h1>
        <p
          className="fade-up"
          style={{
            '--d': '0.14s',
            color: 'var(--muted)',
            fontSize: 16,
            margin: '0 auto',
            maxWidth: 560
          }}
        >
          {projects.length} projects on the shelf ·{' '}
          {projects.filter((p) => p.status === 'stopped').length} waiting for a decision. Two minutes to
          capture what the future you needs.
        </p>
        <div
          className="fade-up"
          style={{ '--d': '0.22s', display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}
        >
          <button className="btn-primary" type="button" onClick={() => navigate('closure')}>
            + Close a new project
          </button>
          <button className="btn-ghost" type="button" onClick={() => navigate('archive')}>
            Browse the archive →
          </button>
        </div>
      </div>

      {/* impact row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, margin: '0 auto 24px' }}>
        <Stat value={revived} label="Revived" hot index={0} />
        <Stat value={archived} label="Archived" index={1} />
        <Stat value={`${avgIdle}d`} label="Avg idle" index={2} />
        <Stat value={projects.length} label="Context cards" index={3} />
      </div>

      {/* staleness nudge */}
      {nudged && (
        <div
          className="panel fade-up"
          style={{
            '--d': '0.3s',
            display: 'flex',
            gap: 14,
            alignItems: 'center',
            padding: '15px 20px',
            marginBottom: 26,
            border: '1px solid var(--accent-2)'
          }}
        >
          <span
            className="nudge-dot"
            style={{
              width: 11,
              height: 11,
              borderRadius: '50%',
              background: 'var(--accent)',
              flexShrink: 0
            }}
          />
          <p style={{ fontSize: 14.5, margin: 0, color: 'var(--body)' }}>
            <strong style={{ color: 'var(--text)' }}>
              {nudged.name} has been paused {daysIdle(nudged)} days.
            </strong>{' '}
            Still worth it? Capture where it stands — or let it go with a reason.
          </p>
          <button
            className="btn-primary"
            type="button"
            style={{ marginLeft: 'auto', padding: '10px 20px', fontSize: 14, flexShrink: 0 }}
            onClick={() => navigate('decision', nudged.id)}
          >
            Decide now
          </button>
        </div>
      )}

      {/* recently shelved — book spines on a shelf */}
      <div
        className="fade-up"
        style={{
          '--d': '0.36s',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: '24px 30px 26px',
          marginBottom: 34
        }}
      >
        <p style={{ fontSize: 11, letterSpacing: 2.6, color: 'var(--accent)', fontWeight: 700, margin: '0 0 6px' }}>
          RECENTLY SHELVED
        </p>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 25, color: 'var(--text)', margin: '0 0 4px' }}>
          Good projects don’t die. They wait on the shelf.
        </h2>
        <p style={{ fontSize: 13.5, color: 'var(--muted)', margin: '0 0 6px' }}>
          Hover to pull one out — click to read its story.
        </p>
        <SpineShelf
          projects={deckProjects.map((p) => ({ ...p }))}
          onSelect={(p) => navigate('profile', p.id)}
        />
        <button
          className="btn-ghost"
          type="button"
          style={{ marginTop: 18, fontSize: 13.5, padding: '9px 18px' }}
          onClick={openSpin}
          disabled={stalled.length === 0}
        >
          🎲 Can’t decide? Spin the shelf
        </button>
      </div>

      {/* on the shelf — free, centred cards */}
      <div className="fade-up" style={{ '--d': '0.44s', textAlign: 'center', marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: 'var(--text)', margin: 0 }}>
          On the shelf
        </h2>
        <p style={{ fontSize: 13.5, color: 'var(--muted)', margin: '6px 0 0' }}>
          Pick any card up — every one carries its full story.
        </p>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 22, justifyContent: 'center', padding: '6px 0 10px' }}>
        {sorted.map((p, i) => (
          <ProjectCard key={p.id} p={p} index={i} onOpen={() => navigate('profile', p.id)} />
        ))}
      </div>

      {/* spin-the-shelf overlay */}
      {(spinning || winner) && (
        <div
          role="dialog"
          aria-label="Spin the shelf"
          onClick={() => !spinning && setWinner(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 40,
            background: 'rgba(12, 0, 22, 0.62)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 22
          }}
        >
          <div
            className="panel pop-in"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 560, width: '100%', padding: '30px 34px', textAlign: 'center' }}
          >
            <p style={{ fontSize: 11, letterSpacing: 3, color: 'var(--accent)', fontWeight: 700, margin: 0 }}>
              SPIN THE SHELF
            </p>
            {spinning ? (
              <>
                <div
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: 38,
                    fontWeight: 700,
                    color: 'var(--accent)',
                    minHeight: 58,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '14px 0 6px'
                  }}
                >
                  {stalled[currentIndex]?.name}
                </div>
                <p style={{ color: 'var(--muted)', margin: '0 0 18px' }}>Shuffling your shelf…</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                  {stalled.map((p, i) => (
                    <span
                      key={p.id}
                      className="tag-pill"
                      style={{
                        ['--tag-color']: i === currentIndex ? 'var(--accent)' : 'var(--surface-2)',
                        color: i === currentIndex ? 'var(--ink)' : 'var(--muted)',
                        transform: i === currentIndex ? 'scale(1.14)' : 'none',
                        opacity: i === currentIndex ? 1 : 0.65,
                        transition: 'transform .09s ease, opacity .09s ease'
                      }}
                    >
                      {p.name}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              winner && (
                <>
                  <p
                    style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: 32,
                      fontWeight: 700,
                      color: 'var(--text)',
                      margin: '14px 0 4px',
                      lineHeight: 1.15
                    }}
                  >
                    Shelf says:<br />{winner.name}
                  </p>
                  <p style={{ color: 'var(--muted)', fontSize: 14.5, margin: '8px 0 22px' }}>
                    {reasonLabel(winner.reason)} · {winner.completion}% complete · idle {daysIdle(winner)}d —
                    it’s been waiting long enough.
                  </p>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                    <button className="btn-primary" type="button" onClick={() => navigate('decision', winner.id)}>
                      Decide it now →
                    </button>
                    <button className="btn-quiet" type="button" onClick={() => setWinner(null)}>
                      Not today
                    </button>
                  </div>
                </>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
