'use client';

import { Moon, Sun } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { useThemeToggle } from './useThemeToggle';

/**
 * Icon button that toggles between light and dark themes.
 */
export const ThemeToggle = ({ className }: { className?: string }) => {
  const { toggle } = useThemeToggle();
  return (
    <Button
      size='icon'
      variant='ghost'
      className={className}
      aria-label='Toggle color theme'
      onClick={toggle}
    >
      <Sun aria-hidden='true' className='size-5 dark:hidden' />
      <Moon aria-hidden='true' className='hidden size-5 dark:block' />
    </Button>
  );
};
