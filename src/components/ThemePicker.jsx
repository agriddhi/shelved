// components/ThemePicker.jsx
const LABELS = { plum: 'Plum', indigo: 'Indigo' };

export default function ThemePicker({ theme, setTheme, themes, mode, toggleMode }) {
  return (
    <div className="theme-picker">
      <div role="radiogroup" aria-label="Shelf theme">
        {themes.map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={theme === t}
            onClick={() => setTheme(t)}
          >
            {LABELS[t] ?? t}
          </button>
        ))}
      </div>
      <button type="button" aria-pressed={mode === 'dark'} onClick={toggleMode}>
        {mode === 'dark' ? 'Dark' : 'Light'}
      </button>
    </div>
  );
}
