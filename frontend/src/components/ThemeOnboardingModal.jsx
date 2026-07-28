import { THEMES, useTheme } from '../ThemeContext';
import './ThemeOnboardingModal.css';

export default function ThemeOnboardingModal({ onDone }) {
  const { theme, setTheme } = useTheme();

  function choose(id) {
    setTheme(id);
    onDone();
  }

  return (
    <div className="theme-onboard-backdrop">
      <div className="theme-onboard">
        <h2>Pick a look for your nook</h2>
        <p>Choose a theme to get started — you can change it anytime from your Profile.</p>
        <div className="theme-onboard-grid">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`theme-onboard-option ${theme === t.id ? 'is-current' : ''}`}
              onClick={() => choose(t.id)}
            >
              <span
                className="theme-onboard-swatch"
                style={{ background: `linear-gradient(135deg, ${t.swatch[0]} 0%, ${t.swatch[1]} 55%, ${t.swatch[2]} 100%)` }}
              />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
        <button type="button" className="theme-onboard-skip" onClick={onDone}>
          Skip for now
        </button>
      </div>
    </div>
  );
}
