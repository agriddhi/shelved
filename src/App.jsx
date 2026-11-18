import { useEffect, useMemo, useRef, useState } from 'react';
import Home from './views/Home.jsx';
import ClosureFlow from './views/ClosureFlow.jsx';
import Profile from './views/Profile.jsx';
import ThinkingSpace from './views/ThinkingSpace.jsx';
import Decision from './views/Decision.jsx';
import ArchiveView from './views/ArchiveView.jsx';
import Dashboard from './views/Dashboard.jsx';
import { useTheme } from './hooks/useTheme.js';
import { useShortcuts, useMedia } from './hooks/hooks.js';
import PageTransition, { usePageDirection } from './components/PageTransition.jsx';
import ThemePicker from './components/ThemePicker.jsx';
import { StreakBadge, ShortcutsModal, useToast } from './components/Extras.jsx';
import ShelvingOverlay from './components/ShelvingOverlay.jsx';
import { loadProjects, saveProjects, bumpShelfStreak } from './lib/store.js';
import { burst, haptic } from './lib/fx.js';

const NAV = [
  { key: 'home', label: 'Home', icon: '⌂' },
  { key: 'archive', label: 'Archive', icon: '◫' },
  { key: 'dashboard', label: 'Dashboard', icon: '◈' }
];

export default function App() {
  const [projects, setProjects] = useState(() => loadProjects());
  const [view, setView] = useState({ name: 'home' });
  const [helpOpen, setHelpOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(() => {
    try { return localStorage.getItem('shelved.sound') === 'on'; } catch { return false; }
  });
  const [shelving, setShelving] = useState(null);
  const [thudKey, setThudKey] = useState(0);
  const [revivingId, setRevivingId] = useState(null);
  const toast = useToast();
  const { theme, mode, toggleMode, cycleTheme, setTheme, themes } = useTheme();
  const isMobile = useMedia('(max-width: 640px)');
  const shelfRef = useRef(null);
  const scrollCache = useRef({});
  const soundToggle = () => {
    const next = !soundOn;
    setSoundOn(next);
    try { localStorage.setItem('shelved.sound', next ? 'on' : 'off'); } catch { /* ignore */ }
  };

  useEffect(() => saveProjects(projects), [projects]);

  const navigate = (name, id) => setView({ name, id });
  const current = useMemo(() => projects.find((p) => p.id === view.id), [projects, view.id]);
  const dir = usePageDirection(view.name);
  const sortedShelf = useMemo(
    () => [...projects].sort((a, b) => (b.lastTouchedAt || 0) - (a.lastTouchedAt || 0)),
    [projects]
  );

  // remember scroll position per view, restore when returning
  useEffect(() => {
    window.scrollTo(0, scrollCache.current[view.name] || 0);
    return () => {
      scrollCache.current[view.name] = window.scrollY;
    };
  }, [view.name, view.id]);

  const notify = (msg, opts) => toast(msg, opts);

  /** Merge or insert a project. User-touched projects lose the seed flag so they persist. */
  const upsert = (proj) => {
    const cleaned = { ...proj };
    delete cleaned.__seed;
    bumpShelfStreak();
    setProjects((list) => {
      const i = list.findIndex((p) => p.id === cleaned.id);
      if (i === -1) return [cleaned, ...list];
      const next = [...list];
      next[i] = cleaned;
      return next;
    });
    return cleaned;
  };

  const remove = (id) => setProjects((list) => list.filter((p) => p.id !== id));

  // ClosureFlow hands us the project + measured card rect before navigating
  const onShelve = (project, rect, elapsed) => {
    const cleaned = upsert(project);
    toast(`“${cleaned.name}” shelved${elapsed ? ` in ${elapsed}` : ''} ✓`);
    setShelving({ project: cleaned, rect });
    navigate('home');
  };

  // shelf swipe actions (mobile) + profile reopen path share the revive effect
  const revive = (p, prev) => {
    setRevivingId(p.id);
    burst();
    haptic(16);
    toast(`“${p.name}” is back on your desk.`, {
      ms: 5000,
      action: { label: 'Undo', run: () => upsert(prev) }
    });
    window.setTimeout(() => setRevivingId(null), 1800);
  };

  const onAction = (type, p) => {
    const now = Date.now();
    const prev = { ...p };
    if (type === 'restart') {
      const next = {
        ...p,
        status: 'active',
        lastTouchedAt: now,
        reopenCount: (p.reopenCount || 0) + 1,
        timeline: [...(p.timeline || []), { type: 'revisited', at: now }]
      };
      upsert(next);
      revive(next, prev);
    } else if (type === 'archive') {
      upsert({
        ...p,
        status: 'archived',
        decision: 'archive',
        lastTouchedAt: now,
        timeline: [...(p.timeline || []), { type: 'decision', at: now, option: 'archive' }]
      });
      toast(`“${p.name}” archived ✓`, {
        action: { label: 'Undo', run: () => upsert(prev) }
      });
    }
  };

  // keyboard shortcuts — never fire while typing in a field
  useShortcuts({
    onNew: () => navigate('closure'),
    onArchive: () => navigate('archive'),
    onDashboard: () => navigate('dashboard'),
    onJump: (i) => {
      if (view.name === 'home') {
        shelfRef.current?.jump(i);
        return;
      }
      const target = sortedShelf[i];
      if (target) navigate('profile', target.id);
    },
    onHome: () => (helpOpen ? setHelpOpen(false) : navigate('home')),
    onHelp: () => setHelpOpen((v) => !v)
  });

  const shared = {
    projects,
    upsert,
    remove,
    navigate,
    notify,
    theme: mode,
    view,
    onAction,
    onShelve
  };

  let screen = null;
  if (view.name === 'home')
    screen = (
      <Home
        {...shared}
        shelfRef={shelfRef}
        shelvingId={shelving?.project.id}
        revivingId={revivingId}
        thudKey={thudKey}
      />
    );
  else if (view.name === 'closure') screen = <ClosureFlow {...shared} />;
  else if (view.name === 'profile')
    screen = current ? <Profile {...shared} project={current} /> : <Home {...shared} shelfRef={shelfRef} />;
  else if (view.name === 'thinking')
    screen = current ? <ThinkingSpace {...shared} project={current} /> : <Home {...shared} shelfRef={shelfRef} />;
  else if (view.name === 'decision')
    screen = current ? <Decision {...shared} project={current} /> : <Home {...shared} shelfRef={shelfRef} />;
  else if (view.name === 'archive') screen = <ArchiveView {...shared} initialReason={view.id} />;
  else if (view.name === 'dashboard') screen = <Dashboard {...shared} />;

  return (
    <div className="app-root" style={{ display: 'flex', minHeight: '100vh' }}>
      <div className="ambient" aria-hidden="true" />

      {/* sidebar */}
      <aside className="sidebar"
        style={{
          width: 232,
          flexShrink: 0,
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          padding: '26px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8
        }}
      >
        <div
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 25,
            fontWeight: 700,
            color: 'var(--text)',
            padding: '0 10px 14px',
            cursor: 'pointer'
          }}
          onClick={() => navigate('home')}
          role="button"
          tabIndex={0}
        >
          Shelved
        </div>

        <button className="btn-primary" type="button" onClick={() => navigate('closure')} style={{ marginBottom: 6 }}>
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
        <StreakBadge />
        <p style={{ fontSize: 11, color: 'var(--muted)', padding: '0 10px', margin: 0 }}>
          Your data never leaves this device.
        </p>

        <ThemePicker theme={theme} setTheme={setTheme} themes={themes} mode={mode} toggleMode={toggleMode} />
        <button
          type="button"
          onClick={soundToggle}
          aria-pressed={soundOn}
          title={soundOn ? 'Sound on' : 'Sound off (default)'}
          style={{
            background: 'var(--surface-2)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: 999,
            padding: '7px 14px',
            fontSize: 12.5,
            cursor: 'pointer',
            width: 'fit-content'
          }}
        >
          {soundOn ? '🔊 Sound on' : '🔇 Sound off'}
        </button>
        <p style={{ fontSize: 10.5, color: 'var(--muted)', textAlign: 'center', margin: '2px 0 0' }}>
          press <span className="kbd">?</span> for shortcuts
        </p>
      </aside>

      {/* main */}
      <main className="app-main" style={{ flex: 1, minWidth: 0, padding: '40px 46px 90px', position: 'relative' }}>
        <PageTransition viewKey={view.name + (view.id || '')} direction={dir}>
          {screen}
        </PageTransition>

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

      {/* mobile bottom tab bar */}
      {isMobile && (
        <nav className="tabbar" role="tablist" aria-label="Primary navigation">
          <div className="tabbar__inner">
            <button role="tab" aria-selected={view.name === 'archive'} onClick={() => navigate('archive')}>
              <span aria-hidden="true">◫</span>Archive
            </button>
            <button role="tab" aria-selected={view.name === 'home'} onClick={() => navigate('home')}>
              <span aria-hidden="true">⌂</span>Home
            </button>
            <button className="tabbar__plus" role="tab" aria-label="Close a new project" onClick={() => navigate('closure')}>
              +
            </button>
            <button role="tab" aria-selected={view.name === 'dashboard'} onClick={() => navigate('dashboard')}>
              <span aria-hidden="true">◈</span>Dashboard
            </button>
            <button role="tab" aria-selected={helpOpen} onClick={() => setHelpOpen(true)}>
              <span aria-hidden="true">?</span>Shortcuts
            </button>
          </div>
        </nav>
      )}

      {/* shelving overlay — card flies into the shelf */}
      {shelving && (
        <ShelvingOverlay
          project={shelving.project}
          fromRect={shelving.rect}
          onLanded={() => setThudKey((k) => k + 1)}
          onDone={() => setShelving(null)}
        />
      )}

      <ShortcutsModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
