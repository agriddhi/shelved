import { useEffect, useRef, useState } from 'react';
import SpineShelf from '../components/SpineShelf.jsx';
import { DraftBanner } from '../components/Extras.jsx';
import ResumeRing from '../components/ResumeRing.jsx';
import Tooltip from '../components/Tooltip.jsx';
import { IdleChip } from '../components/Extras.jsx';
import { CARD_FACES, REASONS, reasonLabel, daysIdle, daysSince } from '../lib/store.js';
import { dustLevel } from '../lib/idle.js';
import { useTilt } from '../hooks/hooks.js';

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
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 10.5,
  fontWeight: 600,
  letterSpacing: 0.4,
  padding: '4px 12px',
  borderRadius: 999,
  color: 'var(--ink)',
  background: color,
  border: '1px solid rgba(255,255,255,0.15)'
});

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

// Simple inline sparkline SVG
function Sparkline({ color = 'var(--accent)', delay = 0 }) {
  const points = Array.from({ length: 12 }, (_, i) => {
    const x = i * 8;
    const y = 12 + Math.sin(i * 1.2 + delay) * 8 + Math.cos(i * 0.7) * 4;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width="88" height="24" viewBox="0 0 88 24" className="sparkline">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
    </svg>
  );
}

function ProjectCard({ p, index, onOpen }) {
  const face = CARD_FACES[index % CARD_FACES.length];
  const idle = daysIdle(p);
  const dust = dustLevel(idle);
  const tilt = useTilt(7);
  const meta =
    p.status === 'active'
      ? `In progress · touched ${daysSince(p.lastTouchedAt)}d ago`
      : p.status === 'archived'
        ? `Archived · idle ${idle}d`
        : `Paused ${idle}d ago`;
  const reasonColor = REASONS.find((r) => r.key === p.reason)?.color || 'var(--surface-hover)';

  return (
    <button
      type="button"
      onClick={() => onOpen()}
      className={`project-card${dust > 0.05 ? ' dust-overlay dusty' : ''}`}
      ref={tilt.ref}
      {...tilt.handlers}
      style={{
        '--tilt': `${TILT[index % TILT.length]}deg`,
        '--d': `${index * 0.07}s`,
        '--card-accent': reasonColor,
        '--dust': dust,
        textAlign: 'left',
        background: face,
        color: 'var(--ink)',
        borderRadius: 16,
        padding: '18px 18px 16px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        width: 260,
        minHeight: 186
      }}
    >
      <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span style={chip(reasonColor)}>
          {reasonLabel(p.reason)}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'rgba(12,10,18,0.5)' }}>
            {p.status.toUpperCase()}
          </span>
          <ResumeRing project={p} size={30} />
        </span>
      </span>
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 19, fontWeight: 700, lineHeight: 1.15, color: 'var(--ink)' }}>
        {p.name}
      </span>
      <span style={{ fontSize: 12.5, lineHeight: 1.35, color: 'rgba(12,10,18,0.65)', flex: 1 }}>
        {p.goal}
      </span>
      <span>
        <span
          style={{
            display: 'block',
            height: 6,
            borderRadius: 3,
            background: 'rgba(12,10,18,0.12)',
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
              background: 'linear-gradient(90deg, var(--accent-2), var(--accent))',
              borderRadius: 3,
              '--d': `${0.25 + index * 0.07}s`
            }}
          />
        </span>
        <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
          <span style={{ color: 'var(--ink)' }}>{p.completion}% done</span>
          <span style={{ color: 'rgba(12,10,18,0.55)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {idle >= 7 ? (
              <Tooltip label={`Last touched ${idle} day${idle === 1 ? '' : 's'} ago`}>
                <IdleChip days={idle} />
              </Tooltip>
            ) : (
              <span style={{ color: 'var(--ok)', fontWeight: 700 }}>fresh</span>
            )}
            {meta}
          </span>
        </span>
      </span>
    </button>
  );
}

function Stat({ value, label, hot, index }) {
  const n = useCountUp(typeof value === 'number' ? value : 0, 900 + index * 120);
  return (
    <div className="bento-card fade-up" style={{ '--d': `${0.08 + index * 0.08}s`, padding: '20px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 34,
            fontWeight: 700,
            color: hot ? 'var(--accent)' : 'var(--text)',
            lineHeight: 1.1
          }}
        >
          {typeof value === 'number' ? n : value}
        </div>
        <Sparkline color={hot ? 'var(--accent)' : 'var(--accent-2)'} delay={index} />
      </div>
      <div style={{ fontSize: 10, letterSpacing: 1.4, color: 'var(--muted)', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
        {label}
      </div>
    </div>
  );
}

export default function Home({ projects, navigate, shelfRef, shelvingId, revivingId, thudKey, onAction }) {
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
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <DraftBanner onResume={() => navigate('closure')} />
      {/* hero */}
      <div style={{ textAlign: 'center', margin: '6px 0 32px' }}>
        <p
          className="fade-up"
          style={{ fontSize: 11, letterSpacing: 3.4, color: 'var(--accent)', fontWeight: 700, margin: 0, fontFamily: "'JetBrains Mono', monospace" }}
        >
          YOUR SHELF
        </p>
        <h1
          className="fade-up"
          style={{
            '--d': '0.05s',
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 52,
            lineHeight: 1.1,
            color: 'var(--text)',
            margin: '16px 0 14px',
            letterSpacing: '-0.03em'
          }}
        >
          {greeting()}. Give it an{' '}
          <br />
          honest ending.
        </h1>
        <p
          className="fade-up"
          style={{
            '--d': '0.14s',
            color: 'var(--muted)',
            fontSize: 17,
            margin: '0 auto',
            maxWidth: 560,
            lineHeight: 1.6
          }}
        >
          {projects.length} projects on the shelf ·{' '}
          {projects.filter((p) => p.status === 'stopped').length} waiting for a decision. Two minutes to
          capture what the future you needs.
        </p>
        <div
          className="fade-up"
          style={{ '--d': '0.22s', display: 'flex', gap: 14, justifyContent: 'center', marginTop: 28 }}
        >
          <button className="btn-primary" type="button" onClick={() => navigate('closure')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            Close a new project
          </button>
          <button className="btn-ghost" type="button" onClick={() => navigate('archive')}>
            Browse the archive
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 6 }}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
        </div>
      </div>

      {/* bento stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, margin: '0 auto 28px' }}>
        <Stat value={revived} label="Revived" hot index={0} />
        <Stat value={archived} label="Archived" index={1} />
        <Stat value={`${avgIdle}d`} label="Avg idle" index={2} />
        <Stat value={projects.length} label="Context cards" index={3} />
      </div>

      {/* staleness nudge */}
      {nudged && (
        <div
          className="fade-up"
          style={{
            '--d': '0.3s',
            display: 'flex',
            gap: 16,
            alignItems: 'center',
            padding: '16px 24px',
            marginBottom: 28,
            borderRadius: 16,
            background: 'linear-gradient(135deg, var(--surface), var(--surface-2))',
            border: '1px solid var(--accent-3)',
            boxShadow: '0 4px 20px rgba(255,159,67,0.1)'
          }}
        >
          <span
            className="nudge-dot"
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: 'var(--accent-3)',
              flexShrink: 0
            }}
          />
          <p style={{ fontSize: 14.5, margin: 0, color: 'var(--body)', lineHeight: 1.5 }}>
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

      {/* recently shelved */}
      <div
        className="fade-up"
        style={{
          '--d': '0.36s',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: '28px 34px 30px',
          marginBottom: 36
        }}
      >
        <p style={{ fontSize: 11, letterSpacing: 2.6, color: 'var(--accent)', fontWeight: 700, margin: '0 0 8px', fontFamily: "'JetBrains Mono', monospace" }}>
          RECENTLY SHELVED
        </p>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, color: 'var(--text)', margin: '0 0 6px' }}>
          Good projects don't die. They wait on the shelf.
        </h2>
        <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 10px' }}>
          Hover to pull one out — click to read its story.
        </p>
        <SpineShelf
          ref={shelfRef}
          projects={deckProjects}
          onOpen={(p) => navigate('profile', p.id)}
          onAction={onAction}
          shelvingId={shelvingId}
          revivingId={revivingId}
          thudKey={thudKey}
        />
        <button
          className="btn-ghost"
          type="button"
          style={{ marginTop: 20, fontSize: 14, padding: '10px 20px' }}
          onClick={openSpin}
          disabled={stalled.length === 0}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
          Can't decide? Spin the shelf
        </button>
      </div>

      {/* on the shelf */}
      <div className="fade-up" style={{ '--d': '0.44s', textAlign: 'center', marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, color: 'var(--text)', margin: 0 }}>
          On the shelf
        </h2>
        <p style={{ fontSize: 14, color: 'var(--muted)', margin: '8px 0 0' }}>
          Pick any card up — every one carries its full story.
        </p>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 22, justifyContent: 'center', padding: '8px 0 10px' }}>
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
            background: 'rgba(12, 10, 18, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 22
          }}
        >
          <div
            className="panel pop-in"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 560, width: '100%', padding: '32px 36px', textAlign: 'center' }}
          >
            <p style={{ fontSize: 11, letterSpacing: 3, color: 'var(--accent)', fontWeight: 700, margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>
              SPIN THE SHELF
            </p>
            {spinning ? (
              <>
                <div
                  className={spinning ? 'flip-anim' : ''}
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 40,
                    fontWeight: 700,
                    color: 'var(--accent)',
                    minHeight: 58,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '16px 0 8px'
                  }}
                >
                  {stalled[currentIndex]?.name}
                </div>
                <p style={{ color: 'var(--muted)', margin: '0 0 20px' }}>Shuffling your shelf…</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                  {stalled.map((p, i) => (
                    <span
                      key={p.id}
                      className="tag-pill"
                      style={{
                        ['--tag-color']: i === currentIndex ? 'var(--accent)' : 'var(--surface-2)',
                        color: i === currentIndex ? 'var(--ink)' : 'var(--muted)',
                        transform: i === currentIndex ? 'scale(1.12)' : 'none',
                        opacity: i === currentIndex ? 1 : 0.55,
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
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 34,
                      fontWeight: 700,
                      color: 'var(--text)',
                      margin: '16px 0 6px',
                      lineHeight: 1.15
                    }}
                  >
                    Shelf says:<br />{winner.name}
                  </p>
                  <p style={{ color: 'var(--muted)', fontSize: 15, margin: '10px 0 26px' }}>
                    {reasonLabel(winner.reason)} · {winner.completion}% complete · idle {daysIdle(winner)}d —
                    it's been waiting long enough.
                  </p>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <button className="btn-primary" type="button" onClick={() => navigate('decision', winner.id)}>
                      Decide it now
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 6 }}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
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
