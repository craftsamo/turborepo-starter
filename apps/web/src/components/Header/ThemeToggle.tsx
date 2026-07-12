'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';

/**
 * A button that toggles between light and dark themes.
 *
 * Renders a stable placeholder until mounted to avoid a hydration mismatch
 * (the resolved theme is only known on the client).
 */
export const ThemeToggle = ({ className }: { className?: string }) => {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  // Only trust the resolved theme after mount to avoid a hydration mismatch.
  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <Button
      size='icon'
      variant='ghost'
      className={className}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? <Moon className='size-5' /> : <Sun className='size-5' />}
    </Button>
  );
};
