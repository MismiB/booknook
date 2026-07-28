import { useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import LibraryPage from './pages/LibraryPage';
import BookDetailPage from './pages/BookDetailPage';
import ProfilePage from './pages/ProfilePage';
import RereadsPage from './pages/RereadsPage';
import AppShell from './components/AppShell';
import ThemeOnboardingModal from './components/ThemeOnboardingModal';
import { useTheme } from './ThemeContext';
import { updateProfile } from './api';

const STORAGE_KEY = 'booknook-auth';

function App() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [showThemeOnboarding, setShowThemeOnboarding] = useState(false);
  const { theme, setTheme } = useTheme();
  const skipNextThemePush = useRef(true);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSession(JSON.parse(saved));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setReady(true);
  }, []);

  // Adopt the account's saved theme on login; if the account has none yet
  // (new signup, or an existing account from before theme sync existed),
  // back-fill it with whatever theme this device currently has active.
  useEffect(() => {
    if (!session) return;
    if (session.user.theme) {
      if (session.user.theme !== theme) setTheme(session.user.theme);
    } else if (session.token) {
      updateProfile(session.token, { theme }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // Push any later theme change (from the Profile theme picker or the
  // onboarding modal) so it follows the account across devices.
  useEffect(() => {
    if (skipNextThemePush.current) {
      skipNextThemePush.current = false;
      return;
    }
    if (!session?.token) return;
    updateProfile(session.token, { theme }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  function handleAuthenticated({ user, token, isNewAccount }) {
    const next = { user, token };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSession(next);
    if (isNewAccount) {
      setShowThemeOnboarding(true);
    }
  }

  function handleLogout() {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }

  function handleUserUpdate(user) {
    setSession((prev) => {
      const next = { ...prev, user };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  if (!ready) return null;

  if (!session) {
    return <AuthPage onAuthenticated={handleAuthenticated} />;
  }

  return (
    <>
      {showThemeOnboarding && (
        <ThemeOnboardingModal onDone={() => setShowThemeOnboarding(false)} />
      )}
      <AppShell user={session.user} onLogout={handleLogout}>
        <Routes>
          <Route
            path="/"
            element={<HomePage user={session.user} token={session.token} onUserUpdate={handleUserUpdate} />}
          />
          <Route path="/library" element={<LibraryPage token={session.token} />} />
          <Route path="/books/:id" element={<BookDetailPage token={session.token} />} />
          <Route path="/rereads" element={<RereadsPage token={session.token} />} />
          <Route
            path="/profile"
            element={<ProfilePage token={session.token} onUserUpdate={handleUserUpdate} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </>
  );
}

export default App;
