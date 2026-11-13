import { useEffect, useMemo, useState } from 'react';
import Home from './views/Home.jsx';
import ClosureFlow from './views/ClosureFlow.jsx';
import Profile from './views/Profile.jsx';
import ThinkingSpace from './views/ThinkingSpace.jsx';
import Decision from './views/Decision.jsx';
import ArchiveView from './views/ArchiveView.jsx';
import Dashboard from './views/Dashboard.jsx';
import { loadProjects, saveProjects } from './lib/store.js';

const NAV = [
  { key: 'home', label: 'Home', icon: '⌂' },
  { key: 'archive', label: 'Archive', icon: '◫' },
  { key: 'dashboard', label: 'Dashboard', icon: '◈' }
];

export default function App() {
  const [projects, setProjects] = useState(() => loadProjects());
  const [view, setView] = useState({ name: 'home' });
  const [toast, setToast] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('shelved-theme') || 'dark');

  useEffect(() => saveProjects(projects), [projects]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('shelved-theme', theme);
  }, [theme]);
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const navigate = (name, id) => setView({ name, id });
  const current = useMemo(() => projects.find((p) => p.id === view.id), [projects, view.id]);

  const notify = (msg) => setToast({ id: Date.now(), msg });

  /** Merge or insert a project. */
  const upsert = (proj) =>
    setProjects((list) => {
      const i = list.findIndex((p) => p.id === proj.id);
      if (i === -1) return [proj, ...list];
      const next = [...list];
      next[i] = proj;
      return next;
    });

  const remove = (id) => setProjects((list) => list.filter((p) => p.id !== id));

  const shared = {
    projects,
    upsert,
    remove,
    navigate,
    notify,
    theme,
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
        <p style={{ fontSize: 11, color: 'var(--muted)', padding: '0 10px 12px', margin: 0 }}>
          Your data never leaves this device.
        </p>
        <button
          type="button"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
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
          {theme === 'dark' ? '☾ Dark' : '☀ Light'}
        </button>
      </aside>

      {/* main */}
      <main style={{ flex: 1, minWidth: 0, padding: '40px 46px 90px', position: 'relative' }}>
        {screen}

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
          <span>Capture in the last two minutes.</span>
        </footer>
      </main>

      {/* toast */}
      {toast && (
        <div
          key={toast.id}
          style={{
            position: 'fixed',
            bottom: 26,
            left: '50%',
            transform: 'translateX(-50%)',
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
