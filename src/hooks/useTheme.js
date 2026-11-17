// useTheme — theme (wood | library | paper) × mode (light | dark), remembered on device.
import { useEffect, useState } from 'react';

export const THEMES = ['wood', 'library', 'paper'];
export const THEME_NAMES = { wood: 'Wood', library: 'Library', paper: 'Paper' };

const get = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const set = (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };

export function useTheme() {
  const [theme, setTheme] = useState(() => (THEMES.includes(get('shelved.theme')) ? get('shelved.theme') : 'library'));
  const [mode, setMode] = useState(() =>
    get('shelved.mode') || (typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('theme-anim');
    root.dataset.theme = theme;
    root.dataset.mode = mode;
    set('shelved.theme', theme);
    set('shelved.mode', mode);
    const id = setTimeout(() => root.classList.remove('theme-anim'), 420);
    return () => clearTimeout(id);
  }, [theme, mode]);

  return {
    theme, mode, setTheme, setMode, themes: THEMES, themeNames: THEME_NAMES,
    toggleMode: () => setMode((m) => (m === 'dark' ? 'light' : 'dark')),
    cycleTheme: () => setTheme((t) => THEMES[(THEMES.indexOf(t) + 1) % THEMES.length])
  };
}
