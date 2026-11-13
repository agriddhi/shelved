import { useState } from 'react';
import { requestSuggest } from '../lib/ai.js';
import { uid } from '../lib/store.js';

const ACTIONS = [
  { key: 'Simplify', desc: 'Cut an overgrown idea back to its core' },
  { key: 'Sharpen', desc: 'Turn a vague direction into something concrete' },
  { key: 'Next Steps', desc: 'Order the scattered thoughts into a plan' }
];

const input = {
  width: '100%',
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: '14px 16px',
  fontSize: 15,
  color: 'var(--text)',
  outline: 'none',
  fontFamily: 'inherit'
};

export default function ThinkingSpace({ project: p, upsert, navigate, notify }) {
  const [notes, setNotes] = useState(p.notes || '');
  const [busy, setBusy] = useState(null);
  const [pending, setPending] = useState(null);
  const kept = (p.suggestions || []).filter((s) => s.kept);

  const saveNotes = () => {
    upsert({ ...p, notes });
    notify('Note saved ✓');
  };

  const run = async (action) => {
    setBusy(action);
    const res = await requestSuggest(action, { ...p, notes });
    setPending({ id: uid(), action, text: res.text, source: res.source });
    setBusy(null);
  };

  const keep = () => {
    upsert({ ...p, suggestions: [...(p.suggestions || []), { ...pending, kept: true }] });
    setPending(null);
    notify('Suggestion saved to profile ✓');
  };

  const dismiss = () => setPending(null);

  const drop = (id) => {
    upsert({ ...p, suggestions: (p.suggestions || []).filter((s) => s.id !== id) });
    notify('Suggestion removed');
  };

  return (
    <div style={{ maxWidth: 820 }}>
      <button className="btn-quiet" type="button" onClick={() => navigate('profile', p.id)} style={{ marginBottom: 18 }}>
        ← Back to {p.name}
      </button>

      <p style={{ fontSize: 11.5, letterSpacing: 3, color: 'var(--accent)', fontWeight: 700, margin: 0 }}>
        THINKING SPACE
      </p>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 32, color: 'var(--text)', margin: '8px 0 4px' }}>
        {p.name}
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: 15, margin: '0 0 22px' }}>
        Free-form notes for new thoughts — the AI never edits them, it only suggests.
      </p>

      <textarea
        style={{ ...input, minHeight: 170, resize: 'vertical', lineHeight: 1.55 }}
        placeholder={'What if…\nThe calendar part could be dropped…\nA friend asked for this feature…'}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
        {ACTIONS.map((a) => (
          <button
            key={a.key}
            className={busy ? 'btn-quiet' : 'btn-ghost'}
            type="button"
            disabled={!!busy}
            onClick={() => run(a.key)}
            title={a.desc}
            style={{ opacity: busy && busy !== a.key ? 0.5 : 1 }}
          >
            {busy === a.key ? 'Thinking…' : a.key}
          </button>
        ))}
        <button className="btn-primary" type="button" style={{ padding: '10px 20px', fontSize: 14 }} onClick={saveNotes}>
          Save note
        </button>
      </div>

      {/* suggestion card */}
      {pending && (
        <div
          className="panel"
          style={{ padding: '20px 24px', marginTop: 24, border: '1px solid var(--accent)' }}
          role="alert"
        >
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
            <span className="tag-pill" style={{ ['--tag-color']: 'var(--accent)' }}>
              {pending.action}
            </span>
            <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>
              {pending.source === 'llm' ? 'AI suggestion · LLM' : 'AI suggestion · rule-based fallback'}
            </span>
          </div>
          <p
            style={{
              fontSize: 15.5,
              lineHeight: 1.6,
              color: 'var(--body)',
              margin: '0 0 16px',
              whiteSpace: 'pre-line'
            }}
          >
            {pending.text}
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-primary" type="button" style={{ padding: '10px 22px', fontSize: 14 }} onClick={keep}>
              Keep it
            </button>
            <button className="btn-quiet" type="button" onClick={dismiss}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* kept suggestions */}
      <div className="panel" style={{ padding: '20px 24px', marginTop: 24 }}>
        <p style={{ fontSize: 11, letterSpacing: 2.6, color: 'var(--accent)', fontWeight: 700, margin: '0 0 6px' }}>
          KEPT SUGGESTIONS ({kept.length})
        </p>
        {kept.length === 0 && (
          <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>
            Nothing kept yet — every response is a keep-or-dismiss card. You are the editor.
          </p>
        )}
        {kept.map((s) => (
          <div
            key={s.id}
            style={{
              borderTop: '1px solid var(--border)',
              padding: '13px 0',
              display: 'flex',
              gap: 14,
              alignItems: 'flex-start'
            }}
          >
            <span className="tag-pill" style={{ ['--tag-color']: 'var(--accent)', flexShrink: 0 }}>
              {s.action}
            </span>
            <span style={{ fontSize: 14, color: 'var(--body)', whiteSpace: 'pre-line', lineHeight: 1.5, flex: 1 }}>
              {s.text}
            </span>
            <button
              className="btn-quiet"
              type="button"
              style={{ fontSize: 12, padding: '6px 12px', flexShrink: 0 }}
              onClick={() => drop(s.id)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
