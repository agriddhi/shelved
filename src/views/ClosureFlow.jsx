import { useEffect, useMemo, useRef, useState } from 'react';
import CompletionRing from '../components/CompletionRing/CompletionRing.jsx';
import { REASONS, uid, daysIdle } from '../lib/store.js';
import { requestDraft, requestSuggest } from '../lib/ai.js';
import { useRotatingPlaceholder } from '../hooks/hooks.js';
import { LiquidProgress, AiThinking } from '../components/Extras.jsx';
import { toRect } from '../components/ShelvingOverlay.jsx';

const DRAFT_KEY = 'shelved.draft';

const STEPS = [
  { key: 'reason', label: 'Why it stopped', emoji: '🛑' },
  { key: 'completion', label: 'How far you got', emoji: '📊' },
  { key: 'next', label: 'What was left', emoji: '📝' },
  { key: 'ai', label: 'AI draft', emoji: '✨' },
  { key: 'review', label: 'Review', emoji: '✅' }
];

// Simple SVG checkmark
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
);

export default function ClosureFlow({ upsert, navigate, notify, theme, projects = [], onShelve }) {
  const rotatingName = useRotatingPlaceholder(projects.map((p) => p.name));
  const [step, setStep] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null')?.step || 0; } catch { return 0; }
  });
  const [reason, setReason] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null')?.reason || REASONS[0].key; } catch { return REASONS[0].key; }
  });
  const [completion, setCompletion] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null')?.completion ?? 15; } catch { return 15; }
  });
  const [done, setDone] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null')?.done || ['']; } catch { return ['']; }
  });
  const [remaining, setRemaining] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null')?.remaining || ['']; } catch { return ['']; }
  });
  const [goal, setGoal] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null')?.goal || ''; } catch { return ''; }
  });
  const [notes, setNotes] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null')?.notes || ''; } catch { return ''; }
  });
  const [name, setName] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null')?.name || ''; } catch { return ''; }
  });
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);
  const ringRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => inputRef.current?.focus(), [step]);

  // draft survives reloads — nothing is ever lost mid-closure
  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ step, name, reason, completion, done, remaining, goal, notes }));
    } catch {
      /* sessionStorage unavailable */
    }
  }, [step, name, reason, completion, done, remaining, goal, notes]);

  const project = useMemo(() => {
    const now = Date.now();
    const id = uid();
    const description = (draft || notes).trim();
    return {
      id,
      name: name.trim() || `Shelf-${id.slice(-4)}`,
      reason,
      completion,
      goal: goal.trim(),
      notes: notes.trim(),
      description,
      done: done.filter(Boolean),
      remaining: remaining.filter(Boolean),
      status: 'stopped',
      lastTouchedAt: now,
      createdAt: now,
      suggestions: [],
      reopenCount: 0,
      timeline: [{ type: 'closed', at: now, option: reason }]
    };
  }, [reason, completion, done, remaining, goal, notes, draft, name]);

  const activeReason = REASONS.find((r) => r.key === reason);

  const fetchDraft = async () => {
    setBusy(true);
    const full = { ...project };
    delete full.__seed;
    const res = await requestDraft(full);
    setDraft(res.text);
    setBusy(false);
  };

  const fetchSuggestion = async (action) => {
    setBusy(true);
    const full = { ...project, notes, suggestions: [] };
    const res = await requestSuggest(action, full);
    setBusy(false);
    return res.text;
  };

  const progress = Math.round(((step + 1) / STEPS.length) * 100);

  const next = () => step < STEPS.length - 1 && setStep((s) => s + 1);
  const prev = () => step > 0 && setStep((s) => s - 1);

  const save = (extra = {}) => {
    const now = Date.now();
    const id = uid();
    // name-collision auto-fix: append -2, -3…
    const base = project.name;
    const existing = new Set(projects.map((p) => (p.name || '').toLowerCase()));
    let unique = base;
    let n = 2;
    while (existing.has(unique.toLowerCase())) unique = `${base}-${n++}`;
    const cleaned = {
      ...project,
      name: unique,
      id,
      timeline: [{ type: 'closed', at: now, option: reason }],
      ...extra
    };
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
    const rect = toRect(cardRef.current);
    if (onShelve) return onShelve(cleaned, rect);
    upsert(cleaned);
    notify('Project closed and context captured ✓');
    navigate('profile', cleaned.id);
  };

  const renderStepIndicator = () => (
    <div className="step-indicator" style={{ marginBottom: 28 }}>
      {STEPS.map((s, i) => (
        <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            className={`step-dot ${i < step ? 'completed' : i === step ? 'active' : 'pending'}`}
          >
            {i < step ? <IconCheck /> : i + 1}
          </div>
          {i < STEPS.length - 1 && (
            <div className={`step-line ${i < step ? 'completed' : ''}`} style={{ width: 32 }} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ maxWidth: 900 }}>
      {/* progress */}
      <div style={{ marginBottom: 22 }}>
        <LiquidProgress value={(step + 1) / STEPS.length} label="Closure progress" />
        <p style={{ fontSize: 12, textAlign: 'right', margin: '8px 0 0', color: 'var(--muted)', fontFamily: "'JetBrains Mono', monospace" }}>
          Step {step + 1} of {STEPS.length}
        </p>
      </div>

      {renderStepIndicator()}

      {/* Step 0: Reason */}
      {step === 0 && (
        <div className="fade-up" style={{ animationDelay: '.08s' }}>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, color: 'var(--text)', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            Why did it stop?
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 16, margin: '0 0 24px' }}>
            Pick the closest reason — you can change this later. The reason shapes what your future self sees.
          </p>
          <div style={{ display: 'grid', gap: 14 }}>
            {REASONS.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setReason(r.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '16px 20px',
                  borderRadius: 16,
                  border: r.key === reason ? '1px solid var(--accent)' : '1px solid var(--border)',
                  borderLeft: r.key === reason ? '4px solid var(--accent)' : '4px solid transparent',
                  background: r.key === reason ? 'var(--surface-2)' : 'var(--surface)',
                  color: 'var(--body)',
                  cursor: 'pointer',
                  fontSize: 15,
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ fontSize: 24, flexShrink: 0 }}>{r.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{r.label}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>{r.desc}</div>
                </div>
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
            <button className="btn-primary" type="button" onClick={next}>
              Next step
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 6 }}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Completion */}
      {step === 1 && (
        <div className="fade-up" style={{ animationDelay: '.08s' }}>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, color: 'var(--text)', margin: '0 0 8px' }}>
            How far did you get?
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 16, margin: '0 0 24px' }}>
            Be honest. A number is fine. It tells future you whether to resume or restart.
          </p>
          <div
            ref={ringRef}
            style={{ display: 'flex', alignItems: 'center', gap: 44, marginBottom: 28 }}
          >
            <div style={{ flexShrink: 0, position: 'relative' }}>
              <CompletionRing percentage={completion} size={160} theme={theme} />
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 36,
                  fontWeight: 700,
                  color: 'var(--accent)'
                }}
              >
                {completion}%
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <input
                ref={inputRef}
                type="range"
                min={0}
                max={100}
                value={completion}
                onChange={(e) => setCompletion(Number(e.target.value))}
                style={{ width: '100%', marginBottom: 18 }}
              />
              <input
                type="number"
                min={0}
                max={100}
                value={completion}
                onChange={(e) => {
                  const v = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                  setCompletion(v);
                }}
                className="input-field"
                style={{ marginBottom: 12, maxWidth: 120 }}
              />
              <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, margin: 0 }}>
                {completion === 0 && 'Not started — only the idea was captured.'}
                {completion > 0 && completion <= 30 && 'Early — most of the thinking is still ahead.'}
                {completion > 30 && completion <= 70 && 'Midpoint — momentum was real, but not enough.'}
                {completion > 70 && completion < 100 && 'Nearly done — what is left is small but specific.'}
                {completion === 100 && 'Complete — this was finished and decided.'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <button className="btn-ghost" type="button" onClick={prev}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}><path d="m15 18-6-6 6-6"/></svg>
              Back
            </button>
            <button className="btn-primary" type="button" onClick={next}>
              Next step
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 6 }}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: What was left */}
      {step === 2 && (
        <div className="fade-up" style={{ animationDelay: '.08s' }}>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, color: 'var(--text)', margin: '0 0 8px' }}>
            What was left?
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 16, margin: '0 0 24px' }}>
            Future you will read this — be specific. Bullet points beat paragraphs.
          </p>

          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 12, letterSpacing: 2, color: 'var(--accent)', fontWeight: 700, margin: '0 0 10px', fontFamily: "'JetBrains Mono', monospace" }}>
              COMPLETED
            </p>
            {done.map((v, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                <input
                  ref={i === done.length - 1 ? inputRef : undefined}
                  className="input-field"
                  style={{ flex: 1, padding: '14px 16px' }}
                  placeholder={`Completed item ${i + 1}`}
                  value={v}
                  onChange={(e) => {
                    const next = [...done];
                    next[i] = e.target.value;
                    if (i === done.length - 1 && e.target.value) next.push('');
                    setDone(next);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && i === done.length - 1) {
                      e.preventDefault();
                      setDone((list) => [...list, '']);
                    }
                  }}
                />
                {done.length > 1 && (
                  <button
                    className="btn-quiet"
                    type="button"
                    style={{ padding: '8px 12px', fontSize: 12 }}
                    onClick={() => setDone((list) => list.filter((_, j) => j !== i))}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 12, letterSpacing: 2, color: 'var(--accent)', fontWeight: 700, margin: '0 0 10px', fontFamily: "'JetBrains Mono', monospace" }}>
              STILL TO DO
            </p>
            {remaining.map((v, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                <input
                  className="input-field"
                  style={{ flex: 1, padding: '14px 16px' }}
                  placeholder={`Remaining item ${i + 1}`}
                  value={v}
                  onChange={(e) => {
                    const next = [...remaining];
                    next[i] = e.target.value;
                    if (i === remaining.length - 1 && e.target.value) next.push('');
                    setRemaining(next);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && i === remaining.length - 1) {
                      e.preventDefault();
                      setRemaining((list) => [...list, '']);
                    }
                  }}
                />
                {remaining.length > 1 && (
                  <button
                    className="btn-quiet"
                    type="button"
                    style={{ padding: '8px 12px', fontSize: 12 }}
                    onClick={() => setRemaining((list) => list.filter((_, j) => j !== i))}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 12, letterSpacing: 2, color: 'var(--accent)', fontWeight: 700, margin: '0 0 10px', fontFamily: "'JetBrains Mono', monospace" }}>
              ORIGINAL GOAL (OPTIONAL)
            </p>
            <input
              className="input-field"
              style={{ maxWidth: 520 }}
              placeholder="What was this project trying to achieve?"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <button className="btn-ghost" type="button" onClick={prev}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}><path d="m15 18-6-6 6-6"/></svg>
              Back
            </button>
            <button className="btn-primary" type="button" onClick={next}>
              Next step
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 6 }}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* Step 3: AI draft */}
      {step === 3 && (
        <div className="fade-up" style={{ animationDelay: '.08s' }}>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, color: 'var(--text)', margin: '0 0 8px' }}>
            AI draft
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 16, margin: '0 0 24px' }}>
            Optionally generate a written draft — future you reads this instead of reconstructing memory.
          </p>
          <div style={{ marginBottom: 20 }}>
            <textarea
              className="notebook-textarea"
              placeholder="Or type your own notes here…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ minHeight: 200, resize: 'vertical' }}
            />
          </div>
          {busy && <AiThinking />}
          {draft && (
            <div
              className="panel slide-in-right"
              style={{ padding: '20px 24px', marginBottom: 20, borderLeft: '3px solid var(--accent-2)' }}
            >
              <p style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--body)', whiteSpace: 'pre-line', margin: 0 }}>
                {draft}
              </p>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button className="btn-primary" type="button" style={{ fontSize: 14, padding: '10px 20px' }} onClick={() => { setNotes(draft); notify('Draft kept ✓'); }}>
                  Use this draft
                </button>
                <button className="btn-quiet" type="button" onClick={() => setDraft('')}>
                  Dismiss
                </button>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <button
              className={busy ? 'btn-quiet' : 'btn-ghost'}
              type="button"
              disabled={busy}
              onClick={fetchDraft}
            >
              {busy ? 'Writing…' : 'Generate draft'}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 6 }}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
            </button>
            <button
              className={busy ? 'btn-quiet' : 'btn-ghost'}
              type="button"
              disabled={busy}
              onClick={async () => {
                const t = await fetchSuggestion('Next Steps');
                if (t) setNotes((n) => (n ? `${n}\n\n${t}` : t));
                notify('Next steps suggestion added ✓');
              }}
            >
              {busy ? 'Thinking…' : 'Suggest next steps'}
            </button>
            <button
              className={busy ? 'btn-quiet' : 'btn-ghost'}
              type="button"
              disabled={busy}
              onClick={async () => {
                const t = await fetchSuggestion('Simplify');
                if (t) setNotes((n) => (n ? `${n}\n\n${t}` : t));
                notify('Simplify suggestion added ✓');
              }}
            >
              {busy ? 'Thinking…' : 'Suggest simplify'}
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <button className="btn-ghost" type="button" onClick={prev}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}><path d="m15 18-6-6 6-6"/></svg>
              Back
            </button>
            <button className="btn-primary" type="button" onClick={next}>
              Review & close
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 6 }}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div className="fade-up" style={{ animationDelay: '.08s' }}>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, color: 'var(--text)', margin: '0 0 8px' }}>
            Review
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 16, margin: '0 0 24px' }}>
            This card will sit on the shelf until you or your future self reads it.
          </p>

          <div ref={cardRef} className="panel" style={{ padding: '24px 28px' }}>
            <input
              className="input-field"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Name it (optional) — ${rotatingName}`}
              aria-label="Project name (optional)"
              style={{ marginBottom: 18, maxWidth: 420, background: 'var(--surface-2)', borderColor: 'var(--border)' }}
            />
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
              <span className="tag-pill" style={{ ['--tag-color']: activeReason?.color || 'var(--surface-hover)' }}>
                {activeReason?.label}
              </span>
              <span className="tag-pill" style={{ ['--tag-color']: 'var(--accent-2)' }}>
                {completion}% done
              </span>
              <span className="tag-pill" style={{ ['--tag-color']: 'var(--accent)' }}>
                idle {daysIdle(project)}d
              </span>
            </div>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, margin: '0 0 8px', color: 'var(--text)' }}>
              {project.name}
            </h3>
            <p style={{ fontSize: 14.5, color: 'var(--muted)', margin: '0 0 18px' }}>
              {goal.trim() || 'No goal written'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
              <div style={{ borderRadius: 12, padding: '14px 18px', background: 'var(--surface-2)' }}>
                <p style={{ fontSize: 10, letterSpacing: 2, color: 'var(--accent-2)', fontWeight: 700, margin: '0 0 8px', fontFamily: "'JetBrains Mono', monospace" }}>
                  COMPLETED
                </p>
                {done.filter(Boolean).length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>Nothing listed</p>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13.5, lineHeight: 1.6, color: 'var(--body)' }}>
                    {done.filter(Boolean).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div style={{ borderRadius: 12, padding: '14px 18px', background: 'var(--surface-2)' }}>
                <p style={{ fontSize: 10, letterSpacing: 2, color: 'var(--accent)', fontWeight: 700, margin: '0 0 8px', fontFamily: "'JetBrains Mono', monospace" }}>
                  STILL TO DO
                </p>
                {remaining.filter(Boolean).length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>Nothing listed</p>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13.5, lineHeight: 1.6, color: 'var(--body)' }}>
                    {remaining.filter(Boolean).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {notes.trim() && (
              <div style={{ borderRadius: 12, padding: '14px 18px', background: 'var(--surface-2)', marginBottom: 18 }}>
                <p style={{ fontSize: 10, letterSpacing: 2, color: 'var(--accent-3)', fontWeight: 700, margin: '0 0 8px', fontFamily: "'JetBrains Mono', monospace" }}>
                  NOTES
                </p>
                <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--body)', whiteSpace: 'pre-line', margin: 0 }}>
                  {notes.trim()}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-primary" type="button" onClick={() => save()}>
                Close project & save context
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 6 }}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              </button>
              <button className="btn-ghost" type="button" onClick={() => save({ status: 'archived' })}>
                Archive immediately
              </button>
              <button className="btn-quiet" type="button" onClick={prev}>
                Go back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
