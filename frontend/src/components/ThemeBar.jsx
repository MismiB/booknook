import { THEMES, useTheme } from '../ThemeContext';
import './ThemeBar.css';

export default function ThemeBar({ inline = false }) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={inline ? 'theme-bar theme-bar--inline' : 'theme-bar'}
      role="group"
      aria-label="Choose a visual theme"
    >
      {!inline && <span className="tb-label">Theme</span>}
      {THEMES.map((t) => (
        <button
          key={t.id}
          className="theme-btn"
          aria-pressed={theme === t.id}
          onClick={() => setTheme(t.id)}
          type="button"
        >
          <span
            className="swatch"
            style={{ background: `linear-gradient(135deg, ${t.swatch[0]} 0%, ${t.swatch[1]} 55%, ${t.swatch[2]} 100%)` }}
          />
          {t.label}
        </button>
      ))}
    </div>
  );
}
