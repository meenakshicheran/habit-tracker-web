'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('habit-theme') as Theme | null;
    const resolved = saved ?? 'dark';
    setTheme(resolved);
    document.documentElement.classList.toggle('dark', resolved === 'dark');
  }, []);

  function toggle() {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('habit-theme', next);
      document.documentElement.classList.toggle('dark', next === 'dark');
      return next;
    });
  }

  return React.createElement(
    ThemeContext.Provider,
    { value: { theme, toggle } },
    children
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
