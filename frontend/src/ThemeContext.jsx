import { createContext, useContext, useEffect, useState } from 'react';

export const THEMES = [
  { id: 'dark-academia', label: 'Dark Academia', swatch: ['#1b130c', '#c8973a', '#ece3cc'] },
  { id: 'cottagecore', label: 'Cottagecore', swatch: ['#f2f1de', '#5f7d4a', '#c97b76'] },
  { id: 'pastels', label: 'Teal Beauty', swatch: ['#eff6fb', '#1f5c80', '#c94f74'] },
  { id: 'universe', label: 'Universe', swatch: ['#05061a', '#c065ff', '#5ad1ff'] },
  { id: 'bubble-pink', label: 'Bubble Pink', swatch: ['#fff3f8', '#ff5fa0', '#7fd8e8'] },
  { id: 'minimalist', label: 'Minimalist', swatch: ['#ffffff', '#adadad', '#111111'] },
  { id: 'artistic', label: 'Artistic', swatch: ['#241a2e', '#ff7a59', '#5ac8fa'] },
];

const STORAGE_KEY = 'booknook-theme';
const DEFAULT_THEME = 'dark-academia';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
