'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Moon, Sun } from 'lucide-react';
import { cva } from 'class-variance-authority';
import { cn } from '@workspace/ui/lib/utils';
import { useThemeToggle } from '../Theme';
import { navItems } from './items';
import { navigationSurfaceVariants } from './styles';
import type { NavigationVariantProps } from './types';
import { useHideOnScroll } from './useHideOnScroll';

const bottomBarVariants = cva('z-40 sm:hidden', {
  variants: {
    variant: {
      docked: 'relative flex items-stretch border-t pb-[env(safe-area-inset-bottom)]',
      floating:
        'fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] mx-auto flex w-[calc(100%-2rem)] max-w-80 flex-col items-end gap-2 transition-transform duration-200 ease-out motion-reduce:transition-none',
    },
  },
  defaultVariants: { variant: 'docked' },
});

const navVariants = cva('', {
  variants: { variant: { docked: 'flex-1', floating: 'w-full rounded-full p-1' } },
  defaultVariants: { variant: 'docked' },
});

const toolVariants = cva(
  'inline-flex items-center justify-center rounded-full text-foreground/80 transition-[color,background-color,transform] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]',
);

const tabVariants = cva(
  'flex w-full select-none flex-col items-center justify-center gap-1 text-xs transition-[color,background-color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset active:scale-[0.97]',
  {
    variants: {
      variant: {
        docked: 'h-12',
        floating: 'h-14 gap-0.5 rounded-full',
      },
      active: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      { variant: 'docked', active: true, className: 'text-foreground' },
      {
        variant: 'docked',
        active: false,
        className: 'text-muted-foreground hover:text-foreground',
      },
      {
        variant: 'floating',
        active: true,
        className:
          'bg-foreground/[0.07] text-primary dark:bg-primary/25 dark:text-primary-foreground',
      },
      {
        variant: 'floating',
        active: false,
        className: 'text-foreground/80 hover:text-foreground',
      },
    ],
    defaultVariants: {
      variant: 'docked',
      active: false,
    },
  },
);

const ThemeIcons = () => (
  <>
    <Sun aria-hidden='true' className='size-5 dark:hidden' />
    <Moon aria-hidden='true' className='hidden size-5 dark:block' />
  </>
);

/**
 * Mobile bottom bar with only destination tabs inside its navigation landmark,
 * icons over labels like the iOS tab bar, the current tab on an inset pill when
 * floating. The theme toggle is not a destination, so it sits outside the nav:
 * above it on its own glass button when floating, at the end of the row when
 * docked. Docked stays in the app-shell flow; floating overlays the page. Both
 * honor the safe-area inset and are hidden from `sm` up, where the `Toolbar`
 * takes over. When floating it slides away while the page scrolls down and
 * returns on scroll up, at either end of the page and when focus enters it (see
 * `useHideOnScroll`); it stays on screen while focus is inside it.
 */
export const BottomNav = ({ variant = 'docked', surface = 'solid' }: NavigationVariantProps) => {
  const pathname = usePathname();
  const { toggle } = useThemeToggle();
  const { hidden, show } = useHideOnScroll(pathname);
  const slidAway = variant === 'floating' && hidden;

  return (
    <div
      data-slot='bottom-bar'
      data-variant={variant}
      data-hidden={slidAway || undefined}
      onFocus={show}
      className={cn(
        bottomBarVariants({ variant }),
        variant === 'docked' && navigationSurfaceVariants({ variant, surface }),
        slidAway &&
          'translate-y-[calc(100%+1rem+env(safe-area-inset-bottom))] focus-within:translate-y-0',
      )}
    >
      {variant === 'floating' && (
        <button
          type='button'
          onClick={toggle}
          aria-label='Toggle color theme'
          className={cn(toolVariants(), navigationSurfaceVariants({ variant, surface }), 'size-11')}
        >
          <ThemeIcons />
        </button>
      )}
      <nav
        aria-label='Primary'
        className={cn(
          navVariants({ variant }),
          variant === 'floating' && navigationSurfaceVariants({ variant, surface }),
        )}
        data-variant={variant}
      >
        <ul className='flex items-stretch'>
          {navItems.map((item) => {
            const active =
              !item.external &&
              (pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(`${item.href}/`)));
            const Icon = item.icon;
            return (
              <li key={item.href} className='flex-1'>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className={tabVariants({ variant, active })}
                >
                  <Icon aria-hidden='true' className='size-5' />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {variant === 'docked' && (
        <button
          type='button'
          onClick={toggle}
          aria-label='Toggle color theme'
          className={cn(tabVariants({ variant }), 'w-20 shrink-0 border-0 bg-transparent')}
        >
          <ThemeIcons />
          <span>Theme</span>
        </button>
      )}
    </div>
  );
};
