import { useState } from 'react';
import { login, signup } from '../api';
import BrandMark from '../components/BrandMark';
import './AuthPage.css';

export default function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const action = mode === 'signin' ? login : signup;
      const { user, token } = await action({ email, password });
      onAuthenticated({ user, token, isNewAccount: mode === 'signup' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function switchMode(next) {
    setMode(next);
    setError('');
  }

  return (
    <div className="stage">
      <section className="nook" aria-hidden="true">
        <div className="glow"></div>
        <div className="sparkle"></div>

        <div className="brand">
          <BrandMark className="brand-mark" />
          <span className="brand-name">BookNook</span>
        </div>

        <div className="hero">
          <p className="eyebrow">Treasure your readings</p>
          <h1>A quiet corner for every book you've opened.</h1>
          <p>&ldquo;I have always imagined that Paradise will be a kind of library.&rdquo;</p>
          <p className="attribution">&mdash; Jorge Luis Borges</p>

          <div className="shelf">
            <svg className="shelf-sketch" viewBox="0 0 200 112" width="240" height="134" preserveAspectRatio="xMinYMax meet">
              <g fill="none" stroke="var(--brass)" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" opacity="0.92">
                <rect x="0" y="26" width="22" height="78" rx="4"/>
                <rect x="28" y="12" width="16" height="92" rx="4"/>
                <rect x="50" y="40" width="26" height="64" rx="4"/>
                <rect x="82" y="18" width="14" height="86" rx="4"/>
                <rect x="102" y="34" width="20" height="70" rx="4"/>
                <rect x="128" y="8" width="18" height="96" rx="4"/>
                <rect x="152" y="44" width="24" height="60" rx="4"/>
                <rect x="182" y="22" width="15" height="82" rx="4"/>
              </g>
              <g fill="none" stroke="var(--brass)" strokeWidth="1" strokeLinecap="round" opacity="0.45">
                <path d="M4,42 Q11,40 18,42"/>
                <path d="M54,56 Q63,54 72,56"/>
                <path d="M106,50 Q112,48 118,50"/>
                <path d="M156,60 Q164,58 172,60"/>
              </g>
            </svg>
            <div className="shelf-base"></div>
          </div>
        </div>
      </section>

      <section className="desk">
        <div className="card">
          <div className="tabs" role="tablist" aria-label="Authentication mode">
            <button
              className="tab"
              role="tab"
              aria-selected={mode === 'signin'}
              onClick={() => switchMode('signin')}
              type="button"
            >
              Sign in
            </button>
            <button
              className="tab"
              role="tab"
              aria-selected={mode === 'signup'}
              onClick={() => switchMode('signup')}
              type="button"
            >
              Create account
            </button>
          </div>

          <h2 className="panel-title">{mode === 'signin' ? 'Welcome back' : 'Start your shelf'}</h2>
          <p className="panel-sub">
            {mode === 'signin'
              ? 'Pick up your bookmark where you left it.'
              : 'Takes about a minute. No due dates, ever.'}
          </p>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder={mode === 'signin' ? '••••••••' : 'At least 8 characters'}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={mode === 'signup' ? 8 : undefined}
                required
              />
            </div>

            {error && <p className="form-error" role="alert">{error}</p>}

            <button className="submit" type="submit" disabled={loading}>
              {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="switch-line">
            {mode === 'signin' ? (
              <>New to BookNook? <a href="#" onClick={(e) => { e.preventDefault(); switchMode('signup'); }}>Create an account</a></>
            ) : (
              <>Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); switchMode('signin'); }}>Sign in</a></>
            )}
          </p>
        </div>
      </section>
    </div>
  );
}
