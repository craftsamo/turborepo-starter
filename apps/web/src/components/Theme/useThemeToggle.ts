'use client';

import { useTheme } from 'next-themes';

/**
 * Shared light/dark toggle action for the navigation.
 */
export const useThemeToggle = () => {
  const { setTheme } = useTheme();

  const toggle = () => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'light' : 'dark');
  };

  return { toggle };
};
