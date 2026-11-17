import { useEffect, useMemo, useState } from 'react';
import Home from './views/Home.jsx';
import ClosureFlow from './views/ClosureFlow.jsx';
import Profile from './views/Profile.jsx';
import ThinkingSpace from './views/ThinkingSpace.jsx';
import Decision from './views/Decision.jsx';
import ArchiveView from './views/ArchiveView.jsx';
import Dashboard from './views/Dashboard.jsx';
import { useTheme, THEME_NAMES } from './hooks/useTheme.js';
import { useShortcuts } from './hooks/hooks.js';
import { loadProjects, saveProjects } from './lib/store.js';

const NAV = [
  { key: 'home', label: 'Home', icon: '⌂' },
  { key: 'archive', label: 'Archive', icon: '◫' },
  { key: 'dashboard', label: 'Dashboard', icon: '◈' }
];

const SHORTCUTS = [
  ['N', 'Close a new project'],
  ['A', 'Go to the archive'],
  ['D', 'Go to the dashboard'],
  ['1–9', 'Jump to that project'],
  ['Esc', 'Back to the shelf'],
  ['?', 'Toggle this help']
];

export default function App() {
  const [projects, setProjects] = useState(() => loadProjects());
  const [view, setView] = useState({ name: 'home' });
  const [toast, setToast] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const { theme, mode, toggleMode, cycleTheme } = useTheme();

  useEffect(() => saveProjects(projects), [projects]);
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const navigate = (name, id) => setView({ name, id });
  const current = useMemo(() => projects.find((p) => p.id === view.id), [projects, view.id]);
  const sortedShelf = useMemo(
    () => [...projects].sort((a, b) => (b.lastTouchedAt || 0) - (a.lastTouchedAt || 0)),
    [projects]
  );

  const notify = (msg) => setToast({ id: Date.now(), msg });

  // keyboard shortcuts — never fire while typing in a field
  useShortcuts({
    onNew: () => navigate('closure'),
    onArchive: () => navigate('archive'),
    onDashboard: () => navigate('dashboard'),
    onJump: (i) => {
      const target = sortedShelf[i];
      if (target) navigate('profile', target.id);
    },
    onHome: () => (helpOpen ? setHelpOpen(false) : navigate('home')),
    onHelp: () => setHelpOpen((v) => !v)
  });

  /** Merge or insert a project. User-touched projects lose the seed flag so they persist. */
  const upsert = (proj) => {
    const cleaned = { ...proj };
    delete cleaned.__seed;
    return setProjects((list) => {
      const i = list.findIndex((p) => p.id === cleaned.id);
      if (i === -1) return [cleaned, ...list];
      const next = [...list];
      next[i] = cleaned;
      return next;
    });
  };

  const remove = (id) => setProjects((list) => list.filter((p) => p.id !== id));

  const shared = {
    projects,
    upsert,
    remove,
    navigate,
    notify,
    theme: mode,
    view
  };

  let screen = null;
  if (view.name === 'home') screen = <Home {...shared} />;
  else if (view.name === 'closure') screen = <ClosureFlow {...shared} />;
  else if (view.name === 'profile')
    screen = current ? <Profile {...shared} project={current} /> : <Home {...shared} />;
  else if (view.name === 'thinking')
    screen = current ? <ThinkingSpace {...shared} project={current} /> : <Home {...shared} />;
  else if (view.name === 'decision')
    screen = current ? <Decision {...shared} project={current} /> : <Home {...shared} />;
  else if (view.name === 'archive') screen = <ArchiveView {...shared} />;
  else if (view.name === 'dashboard') screen = <Dashboard {...shared} />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* sidebar */}
      <aside
        style={{
          width: 232,
          flexShrink: 0,
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          padding: '26px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6
        }}
      >
        <div
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 25,
            fontWeight: 700,
            color: 'var(--text)',
            padding: '0 10px 20px',
            cursor: 'pointer'
          }}
          onClick={() => navigate('home')}
          role="button"
          tabIndex={0}
        >
          Shelved
        </div>

        <button className="btn-primary" type="button" onClick={() => navigate('closure')} style={{ marginBottom: 14 }}>
          + New closure
        </button>

        {NAV.map((n) => {
          const active = view.name === n.key;
          return (
            <button
              key={n.key}
              type="button"
              onClick={() => navigate(n.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '11px 12px',
                borderRadius: 12,
                fontSize: 14.5,
                border: active ? '1px solid var(--border-strong)' : '1px solid transparent',
                background: active ? 'var(--surface-2)' : 'transparent',
                color: active ? 'var(--text)' : 'var(--muted)',
                cursor: 'pointer',
                textAlign: 'left',
                fontWeight: active ? 700 : 500
              }}
            >
              <span style={{ width: 20, fontSize: 15 }}>{n.icon}</span> {n.label}
            </button>
          );
        })}

        <div style={{ flex: 1 }} />
        <p style={{ fontSize: 11, color: 'var(--muted)', padding: '0 10px 10px', margin: 0 }}>
          Your data never leaves this device.
        </p>

        {/* theme cycle: wood → library → paper */}
        <button
          type="button"
          onClick={cycleTheme}
          title="Cycle theme"
          style={{
            background: 'var(--surface-2)',
            color: 'var(--text)',
            border: '1px solid var(--border-strong)',
            borderRadius: 13,
            padding: '10px 14px',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 0.6,
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>{THEME_NAMES[theme] || 'Library'}</span>
          <span style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1 }}>THEME →</span>
        </button>
        {/* mode toggle */}
        <button
          type="button"
          onClick={toggleMode}
          style={{
            background: 'var(--surface-2)',
            color: 'var(--text)',
            border: '1px solid var(--border-strong)',
            borderRadius: 999,
            padding: '9px 16px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {mode === 'dark' ? '☾ Dark' : '☀ Light'}
        </button>
        <p style={{ fontSize: 10.5, color: 'var(--muted)', textAlign: 'center', margin: '2px 0 0' }}>
          press <span className="kbd">?</span> for shortcuts
        </p>
      </aside>

      {/* main */}
      <main style={{ flex: 1, minWidth: 0, padding: '40px 46px 90px', position: 'relative' }}>
        <div key={view.name + (view.id || '')} className="fade-up" style={{ animationDuration: '.45s' }}>
          {screen}
        </div>

        <footer
          style={{
            marginTop: 70,
            paddingTop: 20,
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 12.5,
            color: 'var(--muted)'
          }}
        >
          <span>Shelved · KairoAeonTech · RunUp Coders Hackathon 2026</span>
          <span>N closure · A archive · D dashboard · 1–9 jump</span>
        </footer>
      </main>

      {/* keyboard help overlay */}
      {helpOpen && (
        <div
          role="dialog"
          aria-label="Keyboard shortcuts"
          onClick={() => setHelpOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 45,
            background: 'rgba(10, 0, 18, 0.6)',
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
            style={{ maxWidth: 440, width: '100%', padding: '26px 30px' }}
          >
            <p style={{ fontSize: 11, letterSpacing: 3, color: 'var(--accent)', fontWeight: 700, margin: '0 0 14px' }}>
              KEYBOARD SHORTCUTS
            </p>
            <div style={{ display: 'grid', gap: 12 }}>
              {SHORTCUTS.map(([key, desc]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span className="kbd">{key}</span>
                  <span style={{ fontSize: 14.5, color: 'var(--body)' }}>{desc}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '16px 0 0', textAlign: 'center' }}>
              Press <span className="kbd">?</span> or <span className="kbd">Esc</span> to close
            </p>
          </div>
        </div>
      )}

      {/* toast */}
      {toast && (
        <div
          key={toast.id}
          className="toast-anim"
          style={{
            position: 'fixed',
            bottom: 26,
            left: '50%',
            background: 'var(--cta-bg)',
            color: 'var(--cta-text)',
            borderRadius: 999,
            padding: '12px 26px',
            fontSize: 14.5,
            fontWeight: 700,
            zIndex: 50
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
