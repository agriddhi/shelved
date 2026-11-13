import { useMemo, useState } from 'react';
import { CARD_FACES, REASONS, reasonLabel, daysIdle, daysSince } from '../lib/store.js';

const STATUSES = [
  { key: 'all', label: 'All' },
  { key: 'stopped', label: 'Stopped' },
  { key: 'archived', label: 'Archived' },
  { key: 'active', label: 'Active' }
];

const nightInk = '#290044';

function chip(color) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 10.5,
    fontWeight: 700,
    letterSpacing: 0.4,
    padding: '3px 10px',
    borderRadius: 30,
    color: nightInk,
    background: color,
    border: '1px solid rgba(41,0,68,.3)'
  };
}

function ArchiveCard({ p, index, onOpen }) {
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
      onClick={onOpen}
      style={{
        position: 'relative',
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
        minHeight: 184,
        transition: 'transform .18s ease'
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'rotate(0deg) translateY(-10px) scale(1.03)'; e.currentTarget.style.zIndex = '30'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.zIndex = ''; }}
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
          <span style={{ display: 'block', height: '100%', width: `${p.completion}%`, background: '#500071', borderRadius: 6 }} />
        </span>
        <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700 }}>
          <span>{p.completion}% done</span>
          <span style={{ color: 'rgba(41,0,68,.65)' }}>{meta}</span>
        </span>
      </span>
    </button>
  );
}

export default function ArchiveView({ projects, navigate }) {
  const [status, setStatus] = useState('all');
  const [reason, setReason] = useState('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    return projects
      .filter((p) => (status === 'all' ? true : p.status === status))
      .filter((p) => (reason === 'all' ? true : p.reason === reason))
      .filter((p) => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          p.goal.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (b.lastTouchedAt || 0) - (a.lastTouchedAt || 0));
  }, [projects, status, reason, query]);

  const counts = {
    all: projects.length,
    stopped: projects.filter((p) => p.status === 'stopped').length,
    archived: projects.filter((p) => p.status === 'archived').length,
    active: projects.filter((p) => p.status === 'active').length
  };

  return (
    <div>
      <p style={{ fontSize: 11.5, letterSpacing: 3.2, color: 'var(--accent)', fontWeight: 700, margin: 0 }}>
        ORGANIZED ARCHIVE
      </p>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 34, color: 'var(--text)', margin: '8px 0 4px' }}>
        Every project, kept with its story.
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: 15, margin: '0 0 22px' }}>
        Filter by status, stop reason or name. Nothing is ever deleted — only shelved.
      </p>

      {/* filters */}
      <div
        className="panel"
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          flexWrap: 'wrap',
          padding: '14px 18px',
          marginBottom: 24
        }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          {STATUSES.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setStatus(s.key)}
              style={{
                border: status === s.key ? '1px solid var(--accent)' : '1px solid var(--border)',
                background: status === s.key ? 'var(--surface-2)' : 'transparent',
                color: status === s.key ? 'var(--text)' : 'var(--muted)',
                borderRadius: 999,
                padding: '8px 16px',
                fontSize: 13.5,
                fontWeight: status === s.key ? 700 : 500,
                cursor: 'pointer'
              }}
            >
              {s.label} ({counts[s.key]})
            </button>
          ))}
        </div>

        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          style={{
            background: 'var(--surface-2)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '9px 12px',
            fontSize: 13.5,
            fontFamily: 'inherit'
          }}
        >
          <option value="all">All reasons</option>
          {REASONS.map((r) => (
            <option key={r.key} value={r.key}>
              {r.label}
            </option>
          ))}
        </select>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or goal…"
          style={{
            flex: '1 1 200px',
            minWidth: 180,
            background: 'var(--surface-2)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '9px 14px',
            fontSize: 13.5,
            outline: 'none',
            fontFamily: 'inherit'
          }}
        />
      </div>

      {/* results */}
      {filtered.length === 0 ? (
        <div className="panel" style={{ padding: '40px 30px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: 'var(--text)', margin: '0 0 6px' }}>
            Nothing matches those filters.
          </p>
          <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 18px' }}>
            Try clearing the search, or close a new project to fill the shelf.
          </p>
          <button className="btn-primary" type="button" onClick={() => navigate('closure')}>
            + New closure
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
          {filtered.map((p, i) => (
            <ArchiveCard key={p.id} p={p} index={i} onOpen={() => navigate('profile', p.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
