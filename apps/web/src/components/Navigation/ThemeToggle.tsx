'use client';

import { Moon, Sun } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { useThemeToggle } from './useThemeToggle';

/**
 * Icon button that toggles between light and dark themes. Used in the toolbar
 * (the bottom nav renders its own tab-styled action via `useThemeToggle`).
 */
export const ThemeToggle = ({ className }: { className?: string }) => {
  const { isDark, label, toggle } = useThemeToggle();
  return (
    <Button size='icon' variant='ghost' className={className} aria-label={label} onClick={toggle}>
      {isDark ? <Moon className='size-5' /> : <Sun className='size-5' />}
    </Button>
  );
};
