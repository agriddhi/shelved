import TimelineSlider from '../components/TimelineSlider.jsx';
import HoldButton from '../components/HoldButton/HoldButton.jsx';
import {
  REASONS,
  daysSince,
  daysIdle,
  reasonLabel,
  timelineTitle,
  toMarkdown,
  toColdStartDoc
} from '../lib/store.js';

const TIMELINE_COLORS = {
  dark: {
    background: '#290044',
    cardColor: '#3A0057',
    borderColor: 'rgba(255,255,255,0.15)',
    railColor: '#8A2A78',
    titleColor: '#EEE3B0',
    textColor: '#FFE5D9',
    dateColor: '#F4C8D6',
    accent: '#E3EF4F'
  },
  light: {
    background: '#FBF8F1',
    cardColor: '#F4EFE4',
    borderColor: 'rgba(41,0,68,0.16)',
    railColor: '#9D8189',
    titleColor: '#290044',
    textColor: '#43324E',
    dateColor: '#7A6470',
    accent: '#0F42C0'
  }
};

const HOLD_COLORS = {
  dark: { backgroundColor: '#290044', fillColor: '#E3EF4F', textColor: '#EEE3B0', fillTextColor: '#290044' },
  light: { backgroundColor: '#F4EFE4', fillColor: '#1F06AC', textColor: '#290044', fillTextColor: '#EEE3B0' }
};

function Ring({ value }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" aria-label={`${value}% complete`}>
      <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="5" />
      <circle
        cx="24"
        cy="24"
        r={r}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (value / 100) * c}
        transform="rotate(-90 24 24)"
      />
      <text x="24" y="27" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="var(--text)">
        {value}%
      </text>
    </svg>
  );
}

export default function Profile({ project: p, upsert, remove, navigate, notify, theme = 'dark' }) {
  const reason = REASONS.find((r) => r.key === p.reason);
  const idle = daysIdle(p);
  const kept = (p.suggestions || []).filter((s) => s.kept);

  const timelineItems = [...(p.timeline || [])]
    .sort((a, b) => a.at - b.at)
    .map((e, i, arr) => ({
      date: new Date(e.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }),
      title: timelineTitle(e.type),
      text:
        e.type === 'started'
          ? `Goal: ${p.goal}`
          : e.type === 'closed'
            ? `Closed as ${reasonLabel(p.reason).toLowerCase()}${p.reasonNote ? ` — ${p.reasonNote}` : ''} · ${p.completion}% complete.`
            : e.type === 'revisited'
              ? `Brought back from the shelf — visit #${p.reopenCount || 1}.`
              : e.type === 'decision'
                ? `Decision recorded: ${p.decision || 'unchanged'}.`
                : i === arr.length - 1
                  ? `Last touched · ${p.completion}% complete.`
                  : `Progress checkpoint · ${p.completion}% complete.`
    }));

  const download = () => {
    const blob = new Blob([toMarkdown(p)], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${p.name.replace(/\s+/g, '-').toLowerCase()}-context.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    notify('README exported ✓');
  };

  const coldStart = () => {
    const blob = new Blob([toColdStartDoc(p)], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${p.name.replace(/\s+/g, '-').toLowerCase()}-cold-start.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    notify('Cold-start kit downloaded ✓');
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(toMarkdown(p));
      notify('Copied as Markdown ✓');
    } catch {
      notify('Clipboard blocked — use Export instead');
    }
  };

  const reopen = () => {
    const now = Date.now();
    upsert({
      ...p,
      status: 'active',
      lastTouchedAt: now,
      reopenCount: (p.reopenCount || 0) + 1,
      timeline: [...(p.timeline || []), { type: 'revisited', at: now }]
    });
    notify('Reopened — context restored ✓');
  };

  const destroy = () => {
    remove(p.id);
    notify('Project removed from this device');
    navigate('home');
  };

  const btn = { padding: '10px 18px', fontSize: 14 };

  return (
    <div style={{ maxWidth: 900 }}>
      <button className="btn-quiet" type="button" onClick={() => navigate('home')} style={{ marginBottom: 18 }}>
        ← Back to shelf
      </button>

      {/* header */}
      <div className="panel" style={{ padding: '22px 26px', marginBottom: 22 }}>
        <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
              <span
                className="tag-pill"
                style={{ ['--tag-color']: reason?.color || '#D8E2DC' }}
              >
                {reasonLabel(p.reason)}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1.2,
                  color: p.status === 'active' ? 'var(--accent)' : 'var(--muted)'
                }}
              >
                {p.status.toUpperCase()} · {p.status === 'active' ? `touched ${daysSince(p.lastTouchedAt)}d ago` : `idle ${idle}d`}
              </span>
            </div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 32, color: 'var(--text)', margin: 0 }}>
              {p.name}
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: 14.5, margin: '6px 0 0' }}>{p.goal}</p>
          </div>
          <Ring value={p.completion} />
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
          <button className="btn-primary" type="button" style={btn} onClick={() => navigate('decision', p.id)}>
            Get decision →
          </button>
          <button className="btn-ghost" type="button" style={btn} onClick={() => navigate('thinking', p.id)}>
            Thinking space
          </button>
          {p.status !== 'active' && (
            <button className="btn-ghost" type="button" style={btn} onClick={reopen}>
              Reopen project
            </button>
          )}
          <button className="btn-quiet" type="button" style={btn} onClick={download}>
            Export README
          </button>
          <button className="btn-quiet" type="button" style={btn} onClick={coldStart}>
            Cold-start kit
          </button>
          <button className="btn-quiet" type="button" style={btn} onClick={copy}>
            Copy as Markdown
          </button>
        </div>
      </div>

      {/* context card */}
      <div className="panel" style={{ padding: '22px 26px', marginBottom: 22 }}>
        <p style={{ fontSize: 11, letterSpacing: 2.6, color: 'var(--accent)', fontWeight: 700, margin: '0 0 10px' }}>
          CONTEXT CARD
        </p>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--body)', margin: 0 }}>{p.description}</p>
        {p.reasonNote && (
          <p style={{ fontSize: 13.5, color: 'var(--muted)', margin: '12px 0 0', fontStyle: 'italic' }}>
            Stop note: “{p.reasonNote}”
          </p>
        )}
      </div>

      {/* restart map */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 22 }}>
        {[
          ['DONE', p.done || [], true],
          ['REMAINING', p.remaining || [], false]
        ].map(([label, items, done]) => (
          <div className="panel" key={label} style={{ padding: '20px 24px' }}>
            <p style={{ fontSize: 11, letterSpacing: 2.6, color: 'var(--accent)', fontWeight: 700, margin: '0 0 12px' }}>
              {label}
            </p>
            {items.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>Nothing recorded.</p>}
            {items.map((it) => (
              <div
                key={it}
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  fontSize: 14.5,
                  color: 'var(--body)',
                  padding: '7px 0',
                  borderTop: '1px solid var(--border)'
                }}
              >
                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{done ? '✓' : '○'}</span>
                <span>{it}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* timeline */}
      <div style={{ marginBottom: 22 }}>
        <p style={{ fontSize: 11, letterSpacing: 2.6, color: 'var(--accent)', fontWeight: 700, margin: '0 0 12px' }}>
          AUTOMATIC TIMELINE
        </p>
        <div style={{ borderRadius: 18, overflow: 'hidden', border: '1px solid var(--border)' }}>
          <TimelineSlider
            key={theme}
            items={timelineItems.length ? timelineItems : [{ date: '—', title: 'No events yet', text: '' }]}
            direction="horizontal"
            trigger="scroll"
            intro="first"
            theme="custom"
            {...TIMELINE_COLORS[theme] || TIMELINE_COLORS.dark}
            titleFont={{ fontSize: 15.5, fontWeight: 600 }}
            dateFont={{ fontSize: 12, fontWeight: 700 }}
            textFont={{ fontSize: 13 }}
            maxWidth={940}
            padding="36px 24px 36px 24px"
            canvasOpen={1}
            speed={0.7}
          />
        </div>
      </div>

      {/* suggestions */}
      <div className="panel" style={{ padding: '20px 24px', marginBottom: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <p style={{ fontSize: 11, letterSpacing: 2.6, color: 'var(--accent)', fontWeight: 700, margin: 0 }}>
            SAVED SUGGESTIONS ({kept.length})
          </p>
          <button
            className="btn-quiet"
            type="button"
            style={{ fontSize: 12.5, padding: '7px 14px' }}
            onClick={() => navigate('thinking', p.id)}
          >
            Open thinking space →
          </button>
        </div>
        {kept.length === 0 && (
          <p style={{ color: 'var(--muted)', fontSize: 14, margin: '6px 0 0' }}>
            No suggestions yet — the thinking space turns your notes into Simplify / Sharpen / Next Steps ideas.
          </p>
        )}
        {kept.map((s) => (
          <div
            key={s.id}
            style={{
              borderTop: '1px solid var(--border)',
              padding: '12px 0',
              display: 'flex',
              gap: 14,
              alignItems: 'flex-start'
            }}
          >
            <span className="tag-pill" style={{ ['--tag-color']: 'var(--accent)', flexShrink: 0 }}>
              {s.action}
            </span>
            <span style={{ fontSize: 14, color: 'var(--body)', whiteSpace: 'pre-line', lineHeight: 1.5 }}>
              {s.text}
            </span>
          </div>
        ))}
      </div>

      {/* danger zone */}
      <div
        className="panel"
        style={{
          padding: '18px 24px',
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap'
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 14.5, color: 'var(--text)', fontWeight: 600 }}>
            Don’t want this project on the shelf anymore?
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--muted)' }}>
            Hold to delete permanently from this device. (Archiving keeps it — with its story.)
          </p>
        </div>
        <HoldButton
          {...HOLD_COLORS[theme] || HOLD_COLORS.dark}
          size="sm"
          radius={12}
          holdTime={1600}
          doneLabel="Deleted"
          resetAfter={1400}
          onHold={destroy}
        >
          Hold to delete
        </HoldButton>
      </div>
    </div>
  );
}
