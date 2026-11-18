// useTheme — theme (plum | indigo) × mode (light | dark), remembered on device.
import { useEffect, useState } from 'react';

export const THEMES = ['plum', 'indigo'];
export const THEME_NAMES = { plum: 'Plum', indigo: 'Indigo' };

const get = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const set = (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };

export function useTheme() {
  const [theme, setTheme] = useState(() => (THEMES.includes(get('shelved.theme')) ? get('shelved.theme') : 'plum'));
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
