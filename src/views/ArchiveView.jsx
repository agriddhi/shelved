import { useMemo, useState } from 'react';
import { CARD_FACES, REASONS, reasonLabel, daysIdle, daysSince, toMarkdown } from '../lib/store.js';
import { exportShelf } from '../lib/exportShelf.js';
import { useRecentSearches, useSelection } from '../hooks/hooks.js';
import ResumeRing from '../components/ResumeRing.jsx';

const STATUSES = [
  { key: 'all', label: 'All' },
  { key: 'stopped', label: 'Stopped' },
  { key: 'archived', label: 'Archived' },
  { key: 'active', label: 'Active' }
];

const chip = (color) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 10.5,
  fontWeight: 600,
  letterSpacing: 0.4,
  padding: '4px 12px',
  borderRadius: 999,
  color: 'var(--ink)',
  background: color,
  border: '1px solid rgba(255,255,255,0.15)',
  fontFamily: "'JetBrains Mono', monospace"
});

function ArchiveCard({ p, index, onOpen, selectMode, selected, onToggle }) {
  const face = CARD_FACES[index % CARD_FACES.length];
  const idle = daysIdle(p);
  const meta =
    p.status === 'active'
      ? `In progress · touched ${daysSince(p.lastTouchedAt)}d ago`
      : p.status === 'archived'
        ? `Archived · idle ${idle}d`
        : `Paused ${idle}d ago`;
  const reasonColor = REASONS.find((r) => r.key === p.reason)?.color || 'var(--surface-hover)';

  if (selectMode) {
    return (
      <button
        type="button"
        onClick={() => onToggle(p.id)}
        aria-pressed={selected}
        className="fade-up"
        style={{
          '--d': `${Math.min(index, 12) * 0.04}s`,
          position: 'relative',
          textAlign: 'left',
          background: face,
          color: 'var(--ink)',
          border: selected ? '2px solid var(--accent)' : '1px solid var(--border)',
          borderTop: `3px solid ${reasonColor}`,
          borderRadius: 16,
          padding: '18px 18px 16px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          minHeight: 184,
          transition: 'transform .2s ease, box-shadow .2s ease',
          boxShadow: selected ? '0 0 0 4px rgba(255,107,74,0.2)' : 'none'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.zIndex = '30'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.zIndex = ''; }}
      >
        <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span style={chip(reasonColor)}>
            {reasonLabel(p.reason)}
          </span>
          <span
            aria-hidden="true"
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              border: `2px solid ${selected ? 'var(--accent)' : 'var(--border-strong)'}`,
              background: selected ? 'var(--accent)' : 'transparent',
              color: selected ? 'var(--cta-text)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 14,
              fontFamily: "'Space Grotesk', sans-serif"
            }}
          >
            ✓
          </span>
        </span>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 19, fontWeight: 700, lineHeight: 1.15, color: 'var(--ink)' }}>
          {p.name}
        </span>
        <span style={{ fontSize: 12.5, lineHeight: 1.35, color: 'var(--body)', flex: 1 }}>{p.goal}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="fade-up"
      style={{
        '--d': `${Math.min(index, 12) * 0.04}s`,
        position: 'relative',
        textAlign: 'left',
        background: face,
        color: 'var(--ink)',
        border: '1px solid var(--border)',
        borderTop: `3px solid ${reasonColor}`,
        borderRadius: 16,
        padding: '18px 18px 16px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        minHeight: 184,
        transition: 'transform .2s ease, box-shadow .2s ease'
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.25)'; e.currentTarget.style.zIndex = '30'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.zIndex = ''; }}
    >
      <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span style={chip(reasonColor)}>
          {reasonLabel(p.reason)}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--muted)' }}>
            {p.status.toUpperCase()}
          </span>
          <ResumeRing project={p} size={26} showBadge={false} />
        </span>
      </span>
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 19, fontWeight: 700, lineHeight: 1.15, color: 'var(--ink)' }}>
        {p.name}
      </span>
      <span style={{ fontSize: 12.5, lineHeight: 1.35, color: 'var(--body)', flex: 1 }}>{p.goal}</span>
      <span>
        <span
          style={{
            display: 'block',
            height: 6,
            borderRadius: 3,
            background: 'var(--surface-2)',
            overflow: 'hidden',
            marginBottom: 6,
            border: '1px solid var(--border)'
          }}
        >
          <span
            style={{
              display: 'block',
              height: '100%',
              width: `${p.completion}%`,
              background: 'linear-gradient(90deg, var(--accent-2), var(--accent))',
              borderRadius: 3,
              transition: 'width 0.5s ease'
            }}
          />
        </span>
        <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
          <span style={{ color: 'var(--ink)' }}>{p.completion}% done</span>
          <span style={{ color: 'var(--muted)' }}>{meta}</span>
        </span>
      </span>
    </button>
  );
}

// Empty state ghost icon
const IconGhost = () => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5">
    <path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/>
  </svg>
);

// Search icon
const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
  </svg>
);

export default function ArchiveView({ projects, upsert, remove, navigate, notify, initialReason }) {
  const [status, setStatus] = useState('all');
  const [reason, setReason] = useState(() => initialReason || 'all');
  const [query, setQuery] = useState('');
  const [selectMode, setSelectMode] = useState(false);
  const recents = useRecentSearches(5);
  const selection = useSelection();
  const { items: recentItems, add: addRecent, clear: clearRecents } = recents;

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

  const selectAllVisible = () => {
    if (filtered.length === 0) return;
    const allSelected = filtered.every((p) => selection.has(p.id));
    if (allSelected) selection.clear();
    else selection.set(filtered.map((p) => p.id));
  };

  const selectedSummary = useMemo(() => {
    const chosen = projects.filter((p) => selection.has(p.id));
    const s = chosen.filter((p) => p.status === 'stopped').length;
    const a = chosen.filter((p) => p.status === 'archived').length;
    const act = chosen.filter((p) => p.status === 'active').length;
    return `${s} stopped · ${a} archived · ${act} active`;
  }, [projects, selection]);

  const commitSearch = (q) => addRecent(q);

  const bulkArchive = () => {
    const now = Date.now();
    selection.sel.forEach((id) => {
      const p = projects.find((x) => x.id === id);
      if (p && p.status !== 'archived') {
        upsert({ ...p, status: 'archived', timeline: [...(p.timeline || []), { type: 'decision', at: now }] });
      }
    });
    notify(`${selection.count} project${selection.count === 1 ? '' : 's'} archived ✓`);
    selection.clear();
    setSelectMode(false);
  };

  const bulkRestart = () => {
    const now = Date.now();
    selection.sel.forEach((id) => {
      const p = projects.find((x) => x.id === id);
      if (p) {
        upsert({
          ...p,
          status: 'active',
          lastTouchedAt: now,
          reopenCount: (p.reopenCount || 0) + 1,
          timeline: [...(p.timeline || []), { type: 'revisited', at: now }]
        });
      }
    });
    notify(`${selection.count} project${selection.count === 1 ? '' : 's'} revived ✓`);
    selection.clear();
    setSelectMode(false);
  };

  const bulkDelete = () => {
    if (!window.confirm(`Permanently delete ${selection.count} project${selection.count === 1 ? '' : 's'} from this device? This cannot be undone.`)) return;
    selection.sel.forEach((id) => remove(id));
    notify(`${selection.count} project${selection.count === 1 ? '' : 's'} deleted`);
    selection.clear();
    setSelectMode(false);
  };

  const exportAll = () => {
    exportShelf(projects, toMarkdown);
    notify('Shelf exported as ZIP ✓');
  };

  return (
    <div style={{ maxWidth: 1200 }}>
      <p style={{ fontSize: 11, letterSpacing: 3.2, color: 'var(--accent)', fontWeight: 700, margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>
        ORGANIZED ARCHIVE
      </p>
      <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 40, color: 'var(--text)', margin: '12px 0 6px', letterSpacing: '-0.03em' }}>
        Every project, kept with its story.
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: 16, margin: '0 0 28px', lineHeight: 1.6 }}>
        Filter by status, stop reason or keyword. Nothing is ever deleted — only shelved.
      </p>

      {/* floating filter bar */}
      <div
        className="floating-bar"
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: 16
        }}
      >
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: "'Inter', sans-serif"
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
            borderRadius: 12,
            padding: '9px 12px',
            fontSize: 13.5,
            fontFamily: "'Inter', sans-serif"
          }}
        >
          <option value="all">All reasons</option>
          {REASONS.map((r) => (
            <option key={r.key} value={r.key}>
              {r.label}
            </option>
          ))}
        </select>

        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}>
            <IconSearch />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && commitSearch(query)}
            placeholder="Search name or goal…"
            style={{
              width: '100%',
              background: 'var(--surface-2)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 999,
              padding: '10px 14px 10px 40px',
              fontSize: 13.5,
              outline: 'none',
              fontFamily: "'Inter', sans-serif",
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
            }}
            onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(255,107,74,0.15)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>

        <button className="icon-btn" type="button" onClick={exportAll}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Export ZIP
        </button>
        <button
          className={selectMode ? 'btn-primary' : 'icon-btn'}
          type="button"
          style={{ padding: selectMode ? '10px 18px' : undefined, fontSize: 13 }}
          onClick={() => { setSelectMode(!selectMode); selection.clear(); }}
        >
          {selectMode ? 'Done' : 'Spring clean'}
        </button>
      </div>

      {/* recent searches */}
      {recentItems.length > 0 && !selectMode && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', margin: '0 0 16px' }}>
          <span style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: 1.4, textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>Recent</span>
          {recentItems.map((q) => (
            <button
              key={q}
              type="button"
              className="tag-pill"
              style={{ cursor: 'pointer', ['--tag-color']: 'var(--surface-2)', color: 'var(--muted)', border: '1px solid var(--border)' }}
              onClick={() => setQuery(q)}
            >
              {q}
            </button>
          ))}
          <button
            type="button"
            className="btn-quiet"
            style={{ fontSize: 11, padding: '4px 10px' }}
            onClick={clearRecents}
          >
            Clear
          </button>
        </div>
      )}

      {/* batch action toolbar */}
      {selectMode && (
        <div
          className="panel slide-in-right"
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            padding: '14px 20px',
            margin: '0 0 16px',
            border: '1px solid var(--accent-2)'
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontFamily: "'JetBrains Mono', monospace" }}>
            {selection.count} selected <span style={{ color: 'var(--muted)', fontWeight: 500 }}>· {selectedSummary}</span>
          </span>
          <button className="btn-quiet" type="button" onClick={selectAllVisible} style={{ fontSize: 12.5, padding: '8px 14px' }}>
            {filtered.every((p) => selection.has(p.id)) && filtered.length ? 'Deselect all' : 'Select all visible'}
          </button>
          <button className="btn-primary" type="button" style={{ padding: '9px 18px', fontSize: 13 }} onClick={bulkRestart} disabled={!selection.count}>
            Restart selected
          </button>
          <button className="btn-primary" type="button" style={{ padding: '9px 18px', fontSize: 13 }} onClick={bulkArchive} disabled={!selection.count}>
            Archive selected
          </button>
          <button
            type="button"
            onClick={bulkDelete}
            disabled={!selection.count}
            style={{
              background: 'transparent',
              color: 'var(--tag-lost)',
              border: '1px solid var(--tag-lost)',
              borderRadius: 12,
              padding: '9px 18px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              opacity: selection.count ? 1 : 0.4,
              transition: 'all 0.2s ease'
            }}
          >
            Delete selected
          </button>
          <button className="btn-quiet" type="button" onClick={() => { selection.clear(); setSelectMode(false); }}>
            Cancel
          </button>
        </div>
      )}

      {/* results */}
      {filtered.length === 0 ? (
        <div className="panel" style={{ padding: '60px 30px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <IconGhost />
          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, color: 'var(--text)', margin: '0 0 6px', fontWeight: 600 }}>
            Nothing matches those filters.
          </p>
          <p style={{ color: 'var(--muted)', fontSize: 15, margin: '0 0 18px', lineHeight: 1.6 }}>
            Try clearing the search, or close a new project to fill the shelf.
          </p>
          <button className="btn-primary" type="button" onClick={() => navigate('closure')}>
            Close a new project
          </button>
        </div>
      ) : (
        <div
          key={`${status}-${reason}-${query}-${selectMode}`}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}
        >
          {filtered.map((p, i) => (
            <ArchiveCard
              key={p.id}
              p={p}
              index={i}
              selectMode={selectMode}
              selected={selection.has(p.id)}
              onToggle={selection.toggle}
              onOpen={() => navigate('profile', p.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
