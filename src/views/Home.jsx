import CardSpread from '../components/CardSpread/CardSpread.jsx';
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
      style={{
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
        minHeight: 176,
        transition: 'transform .18s ease'
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
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
            style={{
              display: 'block',
              height: '100%',
              width: `${p.completion}%`,
              background: '#500071',
              borderRadius: 6
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

function Stat({ value, label, hot }) {
  return (
    <div className="panel" style={{ padding: '14px 16px' }}>
      <div
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: 25,
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

  return (
    <div>
      <p style={{ fontSize: 11.5, letterSpacing: 3.2, color: 'var(--accent)', fontWeight: 700, margin: 0 }}>
        YOUR SHELF
      </p>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 34, color: 'var(--text)', margin: '8px 0 4px' }}>
        {greeting()}.
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: 15, margin: '0 0 24px' }}>
        {projects.length} projects · {projects.filter((p) => p.status === 'stopped').length} waiting for a decision
      </p>

      {/* impact row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
        <Stat value={revived} label="Revived" hot />
        <Stat value={archived} label="Archived" />
        <Stat value={`${avgIdle}d`} label="Avg idle" />
        <Stat value={projects.length} label="Context cards" />
      </div>

      {/* staleness nudge */}
      {nudged && (
        <div
          className="panel"
          style={{
            display: 'flex',
            gap: 14,
            alignItems: 'center',
            padding: '15px 20px',
            marginBottom: 26,
            border: '1px solid var(--accent-2)'
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
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
            style={{ marginLeft: 'auto', padding: '10px 20px', fontSize: 14 }}
            onClick={() => navigate('decision', nudged.id)}
          >
            Decide now
          </button>
        </div>
      )}

      {/* recently shelved deck + intro */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 30,
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 18,
          padding: '10px 30px',
          marginBottom: 30
        }}
      >
        <div style={{ flex: '1 1 380px', minWidth: 300 }}>
          <p style={{ fontSize: 11, letterSpacing: 2.6, color: 'var(--accent)', fontWeight: 700 }}>
            RECENTLY SHELVED
          </p>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: 'var(--text)', margin: '6px 0 8px' }}>
            Hover the deck. Click a card to open it.
          </h2>
          <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0, maxWidth: 520 }}>
            Five projects, five reasons they stopped — each one carries its full context card.
            Nothing is ever deleted.
          </p>
        </div>
        <div style={{ flex: '0 0 auto' }}>
          <CardSpread
            projects={deckProjects.map((p) => ({
              name: p.name,
              tag: reasonLabel(p.reason),
              tagKey: p.reason,
              meta: `${p.completion}% · ${daysIdle(p)}d`
            }))}
            onSelect={(proj) => {
              const match = deckProjects.find((d) => d.name === proj.name);
              if (match) navigate('profile', match.id);
            }}
          />
        </div>
      </div>

      {/* project grid */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: 'var(--text)', margin: 0 }}>
          All projects
        </h2>
        <button className="btn-ghost" type="button" onClick={() => navigate('closure')}>
          + Close a new project
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
        {sorted.map((p, i) => (
          <ProjectCard key={p.id} p={p} index={i} onOpen={() => navigate('profile', p.id)} />
        ))}
      </div>
    </div>
  );
}
