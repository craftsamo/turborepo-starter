'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

/**
 * Shared light/dark toggle state for the navigation.
 *
 * Trusts the resolved theme only after mount, so both the toolbar button and
 * the bottom-nav action avoid a hydration mismatch (the theme is known only on
 * the client).
 */
export const useThemeToggle = () => {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';
  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';

  return { isDark, mounted, label, toggle: () => setTheme(isDark ? 'light' : 'dark') };
};
