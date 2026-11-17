import { useEffect, useMemo, useRef, useState } from 'react';
import { REASONS, makeProject, reasonLabel } from '../lib/store.js';
import { requestDraft } from '../lib/ai.js';
import { suggestReason } from '../lib/reason.js';
import { useRotatingPlaceholder } from '../hooks/hooks.js';
import { shelvedChime, haptic } from '../lib/fx.js';

const STEPS = [
  { q: 'What was it?', hint: 'A name and one line on what it was trying to become.' },
  { q: 'What got completed?', hint: 'One item per line — be honest, this becomes your restart map.' },
  { q: 'What remained?', hint: 'One item per line — the work that never happened.' },
  { q: 'Why are you stopping?', hint: 'Pick the closest reason — it drives the decision engine later.' },
  { q: 'Your context card', hint: 'AI drafted this from your answers. Review, edit, approve.' }
];

const lines = (text) =>
  text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

const input = {
  width: '100%',
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: '13px 15px',
  fontSize: 15,
  color: 'var(--text)',
  outline: 'none',
  fontFamily: 'inherit'
};

function loadDraft() {
  try {
    return JSON.parse(sessionStorage.getItem('shelved.draft') || 'null') || {};
  } catch {
    return {};
  }
}

export default function ClosureFlow({ upsert, navigate, notify, projects = [] }) {
  const [saved] = useState(loadDraft);
  const rotatingName = useRotatingPlaceholder(projects.map((p) => p.name));
  const [step, setStep] = useState(saved.step || 0);
  const [name, setName] = useState(saved.name || '');
  const [goal, setGoal] = useState(saved.goal || '');
  const [doneText, setDoneText] = useState(saved.doneText || '');
  const [leftText, setLeftText] = useState(saved.leftText || '');
  const [completion, setCompletion] = useState(saved.completion ?? 50);
  const [reason, setReason] = useState(saved.reason || null);
  const [reasonNote, setReasonNote] = useState(saved.reasonNote || '');
  const [draft, setDraft] = useState('');
  const [source, setSource] = useState(null);
  const [drafting, setDrafting] = useState(false);
  const startedAt = useRef(Date.now());
  const draftAsked = useRef(false);

  // survive HMR / accidental reloads — your words are never lost
  useEffect(() => {
    try {
      sessionStorage.setItem(
        'shelved.draft',
        JSON.stringify({ step, name, goal, doneText, leftText, completion, reason, reasonNote })
      );
    } catch {
      /* sessionStorage unavailable — live with it */
    }
  }, [step, name, goal, doneText, leftText, completion, reason, reasonNote]);

  // step 4: generate the draft once
  useEffect(() => {
    if (step !== 4 || draftAsked.current) return;
    draftAsked.current = true;
    let alive = true;
    setDrafting(true);
    requestDraft({
      name,
      goal,
      done: lines(doneText),
      remaining: lines(leftText),
      reasonLabel: reason ? reasonLabel(reason) : '',
      reasonNote,
      completion
    }).then((res) => {
      if (!alive) return;
      setDraft(res.text);
      setSource(res.source);
      setDrafting(false);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // keyword read of everything written so far → suggested stop reason
  const suggestion = useMemo(
    () =>
      suggestReason({
        name,
        goal,
        done: lines(doneText),
        remaining: lines(leftText),
        notes: reasonNote,
        completion
      }),
    [name, goal, doneText, leftText, reasonNote, completion]
  );

  const canNext =
    (step === 0 && name.trim().length > 1 && goal.trim().length > 3) ||
    (step === 1) ||
    (step === 2) ||
    (step === 3 && reason) ||
    step === 4;

  const next = () => setStep((s) => Math.min(4, s + 1));
  const back = () => {
    if (step === 0) {
      try {
        sessionStorage.removeItem('shelved.draft');
      } catch {
        /* ignore */
      }
      navigate('home');
    } else {
      setStep((s) => s - 1);
    }
  };

  const approve = () => {
    try {
      sessionStorage.removeItem('shelved.draft');
    } catch {
      /* ignore */
    }
    const elapsed = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
    const mm = Math.floor(elapsed / 60);
    const ss = String(elapsed % 60).padStart(2, '0');
    const proj = makeProject({
      name: name.trim(),
      goal: goal.trim(),
      done: lines(doneText),
      remaining: lines(leftText),
      reason,
      reasonNote,
      completion,
      description: draft.trim()
    });
    upsert(proj);
    shelvedChime();
    haptic(18);
    notify(`Context card saved in ${mm}:${ss} ✓`);
    navigate('profile', proj.id);
  };

  return (
    <div style={{ maxWidth: 780 }}>
      <button className="btn-quiet" type="button" onClick={back} style={{ marginBottom: 18 }}>
        ← {step === 0 ? 'Cancel' : 'Back'}
      </button>

      {/* progress */}
      <div
        style={{
          height: 7,
          background: 'var(--surface)',
          borderRadius: 6,
          overflow: 'hidden',
          marginBottom: 26,
          border: '1px solid var(--border)'
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${((step + 1) / STEPS.length) * 100}%`,
            background: 'var(--accent)',
            borderRadius: 6,
            transition: 'width .3s ease'
          }}
        />
      </div>

      <p style={{ fontSize: 11.5, letterSpacing: 3, color: 'var(--accent)', fontWeight: 700, margin: 0 }}>
        GUIDED CLOSURE · STEP {step + 1} OF {STEPS.length}
      </p>
      <div key={step} className="fade-slide-in">
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 32, color: 'var(--text)', margin: '8px 0 4px' }}>
        {STEPS[step].q}
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: 15, margin: '0 0 24px' }}>{STEPS[step].hint}</p>

      {step === 0 && (
        <div style={{ display: 'grid', gap: 14 }}>
          <input
            style={input}
            placeholder={`Project name — ${rotatingName}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <input
            style={input}
            placeholder="What was it trying to become? (one line)"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
        </div>
      )}

      {step === 1 && (
        <div style={{ display: 'grid', gap: 14 }}>
          <textarea
            style={{ ...input, minHeight: 180, resize: 'vertical' }}
            placeholder={'Auth & onboarding\nDashboard v2\nLocal persistence'}
            value={doneText}
            onChange={(e) => setDoneText(e.target.value)}
            autoFocus
          />
          <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: 0 }}>
            {lines(doneText).length} item{lines(doneText).length === 1 ? '' : 's'} recorded
          </p>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: 'grid', gap: 18 }}>
          <textarea
            style={{ ...input, minHeight: 150, resize: 'vertical' }}
            placeholder={'Calendar sync\nReminder engine'}
            value={leftText}
            onChange={(e) => setLeftText(e.target.value)}
            autoFocus
          />
          <div className="panel" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 14, color: 'var(--body)' }}>How complete does it feel?</span>
              <span style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>
                {completion}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={completion}
              onChange={(e) => setCompletion(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent)' }}
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ display: 'grid', gap: 14 }}>
          {suggestion && suggestion.confidence >= 40 && (
            <button
              type="button"
              onClick={() => setReason(suggestion.key)}
              className="panel fade-up"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 18px',
                cursor: 'pointer',
                textAlign: 'left',
                border: '1px solid var(--accent-2)'
              }}
            >
              <span
                className="tag-pill"
                style={{ ['--tag-color']: 'var(--accent)', flexShrink: 0 }}
              >
                AI SUGGESTION · KEYWORD
              </span>
              <span style={{ fontSize: 14.5, color: 'var(--body)' }}>
                <strong style={{ color: 'var(--text)' }}>{reasonLabel(suggestion.key)}</strong> — {suggestion.confidence}%
                confidence from your answers. Tap to use it.
              </span>
            </button>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {REASONS.map((r) => {
              const on = reason === r.key;
              return (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setReason(r.key)}
                  style={{
                    textAlign: 'left',
                    padding: '16px 18px',
                    borderRadius: 14,
                    cursor: 'pointer',
                    background: on ? 'var(--surface-2)' : 'var(--surface)',
                    border: on ? '2px solid var(--accent)' : '2px solid var(--border)',
                    color: 'var(--text)'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        background: r.color,
                        border: '1.5px solid rgba(41,0,68,.4)',
                        flexShrink: 0
                      }}
                    />
                    <span style={{ fontSize: 16, fontWeight: 700 }}>{r.label}</span>
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>{r.desc}</span>
                </button>
              );
            })}
          </div>
          <input
            style={input}
            placeholder="Add a note (optional) — e.g. placement prep took the evenings"
            value={reasonNote}
            onChange={(e) => setReasonNote(e.target.value)}
          />
        </div>
      )}

      {step === 4 && (
        <div>
          <div
            className="panel"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 16px',
              marginBottom: 12,
              fontSize: 12.5
            }}
          >
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
              {drafting ? 'DRAFTING…' : source === 'llm' ? 'AI DRAFT · LLM' : 'AI DRAFT · RULE-BASED FALLBACK'}
            </span>
            <span style={{ color: 'var(--muted)' }}>
              {drafting ? 'reading your answers' : 'editable — you approve the final wording'}
            </span>
          </div>
          {drafting ? (
            <div className="panel" style={{ padding: 18, display: 'grid', gap: 12 }}>
              <div className="skeleton" style={{ height: 16, width: '82%' }} />
              <div className="skeleton" style={{ height: 16, width: '96%' }} />
              <div className="skeleton" style={{ height: 16, width: '71%' }} />
              <div className="skeleton" style={{ height: 16, width: '88%' }} />
              <div className="skeleton" style={{ height: 16, width: '55%' }} />
            </div>
          ) : (
            <textarea
              style={{ ...input, minHeight: 240, resize: 'vertical', lineHeight: 1.55 }}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
          )}
          <div style={{ display: 'flex', gap: 12, marginTop: 18, alignItems: 'center' }}>
            <button className="btn-primary" type="button" onClick={approve} disabled={drafting}>
              Approve & open profile
            </button>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>
              Saved with your reason: {reason ? reasonLabel(reason) : '—'}
            </span>
          </div>
        </div>
      )}

      </div>

      {/* nav */}
      {step < 4 && (
        <div style={{ display: 'flex', gap: 12, marginTop: 26 }}>
          <button className="btn-primary" type="button" onClick={next} disabled={!canNext}>
            {step === 3 ? 'Draft my context card →' : 'Next →'}
          </button>
          {!canNext && (
            <span style={{ fontSize: 13, color: 'var(--muted)', alignSelf: 'center' }}>
              {step === 0 ? 'A name and a one-line goal are required' : step === 3 ? 'Pick a reason to continue' : 'Continue'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
