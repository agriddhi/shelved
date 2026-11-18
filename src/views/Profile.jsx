import { useState } from 'react';
import TimelineSlider from '../components/TimelineSlider.jsx';
import HoldButton from '../components/HoldButton/HoldButton.jsx';
import { useHoldTicks } from '../hooks/hooks.js';
import {
  REASONS,
  daysSince,
  daysIdle,
  reasonLabel,
  timelineTitle,
  toMarkdown,
  toColdStartDoc
} from '../lib/store.js';
import { resumeScore } from '../lib/resume.js';
import { similarProjects } from '../lib/idle.js';
import { burst, haptic } from '../lib/fx.js';

// Timeline colors for canvas rendering (must be actual hex values)
const TIMELINE_COLORS = {
  dark: {
    background: '#16121f',
    cardColor: '#1e1929',
    borderColor: 'rgba(255,255,255,0.08)',
    railColor: '#2a2338',
    titleColor: '#e8e0d5',
    textColor: '#c4b8a8',
    dateColor: '#7a6f85',
    accent: '#ff6b4a'
  },
  light: {
    background: '#ffffff',
    cardColor: '#ede8e2',
    borderColor: 'rgba(26,21,32,0.10)',
    railColor: '#e2dcd4',
    titleColor: '#1a1520',
    textColor: '#4a4252',
    dateColor: '#8a8290',
    accent: '#e85a3a'
  }
};

const HOLD_COLORS = {
  dark: { backgroundColor: '#16121f', fillColor: '#ff6b4a', textColor: '#e8e0d5', fillTextColor: '#0c0a12' },
  light: { backgroundColor: '#ede8e2', fillColor: '#e85a3a', textColor: '#1a1520', fillTextColor: '#ffffff' }
};

/** Completion ring with gradient stroke */
function Ring({ value, theme }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const gradientId = `ringGrad-${theme}`;
  const accent = theme === 'dark' ? '#ff6b4a' : '#e85a3a';
  const accent2 = theme === 'dark' ? '#00d4aa' : '#00b894';
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" aria-label={`${value}% complete`}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={accent2} />
          <stop offset="100%" stopColor={accent} />
        </linearGradient>
      </defs>
      <circle cx="28" cy="28" r={r} fill="none" stroke="var(--border)" strokeWidth="5" />
      <circle
        cx="28" cy="28" r={r} fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (value / 100) * c}
        transform="rotate(-90 28 28)"
      />
      <text x="28" y="32" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--text)">
        {value}%
      </text>
    </svg>
  );
}

/** Semi-circular gauge for restart readiness */
function Gauge({ value, theme }) {
  const r = 38;
  const c = Math.PI * r;
  const offset = c - (value / 100) * c;
  const accent = theme === 'dark' ? '#ff6b4a' : '#e85a3a';
  const accent2 = theme === 'dark' ? '#00d4aa' : '#00b894';
  const gradientId = `gaugeGrad-${theme}`;
  return (
    <div className="gauge-container" style={{ width: 100, height: 60 }}>
      <svg width="100" height="60" viewBox="0 0 100 60">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={accent2} />
            <stop offset="100%" stopColor={accent} />
          </linearGradient>
        </defs>
        <path
          d={`M 10 50 A ${r} ${r} 0 0 1 90 50`}
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d={`M 10 50 A ${r} ${r} 0 0 1 90 50`}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>
      <div className="gauge-value">{value}%</div>
    </div>
  );
}

export default function Profile({ project: p, projects = [], upsert, remove, navigate, notify, theme = 'dark' }) {
  const reason = REASONS.find((r) => r.key === p.reason);
  const idle = daysIdle(p);
  const kept = (p.suggestions || []).filter((s) => s.kept);
  const readiness = resumeScore(p);
  const similar = similarProjects(p, projects, 3);
  const [holding, setHolding] = useState(false);
  useHoldTicks(holding);

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
    upsert({ ...p, kitDownloadedAt: Date.now() });
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
    const prev = { ...p };
    upsert({
      ...p,
      status: 'active',
      lastTouchedAt: now,
      reopenCount: (p.reopenCount || 0) + 1,
      timeline: [...(p.timeline || []), { type: 'revisited', at: now }]
    });
    burst();
    haptic(14);
    notify(`“${p.name}” is back on your desk.`, {
      ms: 5000,
      action: { label: 'Undo', run: () => upsert(prev) }
    });
  };

  const destroy = () => {
    remove(p.id);
    notify('Project removed from this device');
    navigate('home');
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <button className="btn-quiet" type="button" onClick={() => navigate('home')} style={{ marginBottom: 18 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}><path d="m15 18-6-6 6-6"/></svg>
        Back to shelf
      </button>

      {/* hero banner */}
      <div className="panel" style={{ padding: '28px 32px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: 'linear-gradient(90deg, var(--accent-2), var(--accent))'
          }}
        />
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
              <span className="tag-pill" style={{ ['--tag-color']: reason?.color || 'var(--surface-hover)' }}>
                {reasonLabel(p.reason)}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: p.status === 'active' ? 'var(--accent)' : 'var(--muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                {p.status.toUpperCase()} · {p.status === 'active' ? `touched ${daysSince(p.lastTouchedAt)}d ago` : `idle ${idle}d`}
              </span>
            </div>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 40, color: 'var(--text)', margin: 0, letterSpacing: '-0.03em' }}>
              {p.name}
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: 15, margin: '8px 0 0' }}>{p.goal}</p>
          </div>
          <Ring value={p.completion} theme={theme} />
        </div>

        {/* action button bar */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 24, position: 'relative', zIndex: 1 }}>
          <button className="btn-primary" type="button" onClick={() => navigate('decision', p.id)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Get decision
          </button>
          <button className="btn-ghost" type="button" onClick={() => navigate('thinking', p.id)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Thinking space
          </button>
          {p.status !== 'active' && (
            <button className="btn-ghost" type="button" onClick={reopen}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              Reopen
            </button>
          )}
          <button className="icon-btn" type="button" onClick={download} title="Export README">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            <span>Export</span>
          </button>
          <button className="icon-btn" type="button" onClick={coldStart} title="Cold-start kit">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M9 9h.01"/><path d="M15 9h.01"/><path d="M9 15h.01"/><path d="M15 15h.01"/></svg>
            <span>Cold-start</span>
          </button>
          <button className="icon-btn" type="button" onClick={copy} title="Copy Markdown">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            <span>Copy</span>
          </button>
        </div>
      </div>

      {/* restart readiness gauge */}
      <div
        className="panel fade-up"
        style={{ '--d': '0.08s', padding: '20px 24px', marginBottom: 24, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}
      >
        <Gauge value={readiness.score} theme={theme} />
        <div style={{ flex: 1, minWidth: 240 }}>
          <p style={{ fontSize: 11, letterSpacing: 2.4, color: 'var(--accent)', fontWeight: 700, margin: '0 0 4px', fontFamily: "'JetBrains Mono', monospace" }}>
            RESTART READINESS
          </p>
          {readiness.missing.length === 0 ? (
            <p style={{ fontSize: 14.5, color: 'var(--text)', margin: 0 }}>
              This context card is restart-proof — future you thanks you.
            </p>
          ) : (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
              {readiness.missing.slice(0, 4).map((m) => (
                <span className="tag-pill" key={m.key} style={{ ['--tag-color']: 'var(--tag-lost)' }}>
                  +{m.points} {m.label}
                </span>
              ))}
            </div>
          )}
        </div>
        {readiness.missing.length > 0 && (
          <button className="btn-quiet" type="button" style={{ fontSize: 12.5, padding: '8px 14px', flexShrink: 0 }} onClick={() => navigate('thinking', p.id)}>
            Fill the gaps →
          </button>
        )}
      </div>

      {/* similar projects */}
      {similar.length > 0 && (
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: '-6px 0 18px', paddingLeft: 4 }}>
          You also shelved for "{reasonLabel(p.reason).toLowerCase()}":{' '}
          {similar.map((o, i) => (
            <span key={o.id}>
              <button
                type="button"
                onClick={() => navigate('profile', o.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: 'var(--accent)',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600
                }}
              >
                {o.name}
              </button>
              {i < similar.length - 1 ? ', ' : ''}
            </span>
          ))}
          {' · '}
          <button
            type="button"
            onClick={() => navigate('archive', p.reason)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: 'var(--muted)',
              cursor: 'pointer',
              fontSize: 12.5,
              textDecoration: 'underline'
            }}
          >
            see all →
          </button>
        </p>
      )}

      {/* context card */}
      <div className="panel" style={{ padding: '22px 26px', marginBottom: 22 }}>
        <p style={{ fontSize: 11, letterSpacing: 2.6, color: 'var(--accent)', fontWeight: 700, margin: '0 0 10px', fontFamily: "'JetBrains Mono', monospace" }}>
          CONTEXT CARD
        </p>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--body)', margin: 0 }}>{p.description}</p>
        {p.reasonNote && (
          <p style={{ fontSize: 13.5, color: 'var(--muted)', margin: '12px 0 0', fontStyle: 'italic' }}>
            Stop note: "{p.reasonNote}"
          </p>
        )}
      </div>

      {/* restart map — checklist style */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 22 }}>
        {[
          ['DONE', p.done || [], true],
          ['REMAINING', p.remaining || [], false]
        ].map(([label, items, done]) => (
          <div className="panel" key={label} style={{ padding: '20px 24px' }}>
            <p style={{ fontSize: 11, letterSpacing: 2.6, color: done ? 'var(--accent-2)' : 'var(--accent)', fontWeight: 700, margin: '0 0 12px', fontFamily: "'JetBrains Mono', monospace" }}>
              {label}
            </p>
            {items.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>Nothing recorded.</p>}
            {items.map((it) => (
              <div
                key={it}
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                  fontSize: 14.5,
                  color: 'var(--body)',
                  padding: '8px 0',
                  borderTop: '1px solid var(--border)'
                }}
              >
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: 13,
                    fontWeight: 700,
                    background: done ? 'var(--accent-2)' : 'transparent',
                    color: done ? 'var(--ink)' : 'var(--accent)',
                    border: done ? 'none' : `2px solid var(--accent)`
                  }}
                >
                  {done ? '✓' : '○'}
                </span>
                <span>{it}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* timeline */}
      <div style={{ marginBottom: 22 }}>
        <p style={{ fontSize: 11, letterSpacing: 2.6, color: 'var(--accent)', fontWeight: 700, margin: '0 0 12px', fontFamily: "'JetBrains Mono', monospace" }}>
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
            {...(TIMELINE_COLORS[theme] || TIMELINE_COLORS.dark)}
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
          <p style={{ fontSize: 11, letterSpacing: 2.6, color: 'var(--accent)', fontWeight: 700, margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>
            SAVED SUGGESTIONS ({kept.length})
          </p>
          <button className="btn-quiet" type="button" style={{ fontSize: 12.5, padding: '7px 14px' }} onClick={() => navigate('thinking', p.id)}>
            Open thinking space →
          </button>
        </div>
        {kept.length === 0 && (
          <p style={{ color: 'var(--muted)', fontSize: 14, margin: '6px 0 0' }}>
            No suggestions yet — the thinking space turns your notes into Simplify / Sharpen / Next Steps ideas.
          </p>
        )}
        {kept.map((s) => (
          <div key={s.id} style={{ borderTop: '1px solid var(--border)', padding: '12px 0', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
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
      <div className="panel" style={{ padding: '18px 24px', display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: 0, fontSize: 14.5, color: 'var(--text)', fontWeight: 600 }}>
            Don't want this project on the shelf anymore?
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--muted)' }}>
            Hold to delete permanently from this device. (Archiving keeps it — with its story.)
          </p>
        </div>
        <HoldButton
          {...(HOLD_COLORS[theme] || HOLD_COLORS.dark)}
          size="sm"
          radius={12}
          holdTime={1600}
          doneLabel="Deleted"
          resetAfter={1400}
          onHold={destroy}
          onHoldingChange={setHolding}
        >
          Hold to delete
        </HoldButton>
      </div>
    </div>
  );
}
