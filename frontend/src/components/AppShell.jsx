import { Link, useLocation } from 'react-router-dom';
import BrandMark from './BrandMark';
import Watermark from './Watermark';
import './AppShell.css';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/library', label: 'Library Nook' },
  { to: '/rereads', label: 'Re-reads' },
  { to: '/profile', label: 'Profile' },
];

export default function AppShell({ user, onLogout, children }) {
  const location = useLocation();

  return (
    <>
      <Watermark />
      <div className="app-shell">
        <header className="app-header">
          <span className="app-brand">
            <BrandMark className="app-brand-mark" />
            BookNook
          </span>
          <nav className="app-nav">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={location.pathname === link.to ? 'active' : ''}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="app-user">
            <span>{user.name || 'Reader'}</span>
            <button onClick={onLogout} type="button">Log out</button>
          </div>
        </header>
        <main className="app-main">{children}</main>
      </div>
    </>
  );
}
