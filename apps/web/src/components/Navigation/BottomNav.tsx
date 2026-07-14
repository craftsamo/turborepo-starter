'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Moon, Sun } from 'lucide-react';
import { cva } from 'class-variance-authority';
import { cn } from '@workspace/ui/lib/utils';
import { navItems } from './items';
import { navigationSurfaceVariants } from './styles';
import type { NavigationVariantProps } from './types';
import { useThemeToggle } from './useThemeToggle';

const bottomNavVariants = cva('relative z-40 sm:hidden', {
  variants: {
    variant: {
      docked: 'border-t pb-[env(safe-area-inset-bottom)]',
      floating:
        'fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] mx-auto w-[calc(100%-2rem)] max-w-72 rounded-full',
    },
  },
  defaultVariants: {
    variant: 'docked',
  },
});

const tabVariants = cva(
  'flex w-full select-none flex-col items-center justify-center gap-1 text-xs transition-[color,background-color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset active:scale-95',
  {
    variants: {
      variant: {
        docked: 'h-12',
        floating: 'h-11 rounded-full',
      },
      active: {
        true: '',
        false: 'text-muted-foreground hover:text-foreground',
      },
    },
    compoundVariants: [
      { variant: 'docked', active: true, className: 'text-foreground' },
      {
        variant: 'floating',
        active: true,
        className: 'bg-primary/10 text-primary',
      },
    ],
    defaultVariants: {
      variant: 'docked',
      active: false,
    },
  },
);

/**
 * Bottom tab bar shown below the `sm` breakpoint. It lives outside the scroll
 * region, so docked mode stays in the app-shell flow while floating mode
 * overlays the viewport as an inset Liquid Glass capsule. Both modes honor the
 * safe-area inset on notched devices. Hidden from `sm` up, where the `Toolbar`
 * takes over.
 */
export const BottomNav = ({ variant = 'docked' }: NavigationVariantProps) => {
  const pathname = usePathname();
  const { isDark, label, toggle } = useThemeToggle();

  return (
    <nav
      aria-label='Primary'
      className={cn(
        bottomNavVariants({ variant }),
        navigationSurfaceVariants({ variant }),
        variant === 'floating' &&
          'bg-background/85 from-white/45 to-white/10 shadow-[0_12px_40px_rgba(15,23,42,0.2)] dark:bg-secondary/80 dark:from-white/14 dark:to-white/5 dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)]',
      )}
      data-variant={variant}
    >
      <ul className='flex items-stretch'>
        {navItems.map((item) => {
          const active = !item.external && pathname === item.href;
          const Icon = item.icon;
          return (
            <li key={item.href} className='flex-1'>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className={tabVariants({ variant, active })}
              >
                <Icon className='size-5' />
                <span className={variant === 'floating' ? 'sr-only' : undefined}>{item.label}</span>
              </Link>
            </li>
          );
        })}
        <li className='flex-1'>
          <button
            type='button'
            onClick={toggle}
            aria-label={label}
            className={cn(tabVariants({ variant }), 'border-0 bg-transparent')}
          >
            {isDark ? <Moon className='size-5' /> : <Sun className='size-5' />}
            <span className={variant === 'floating' ? 'sr-only' : undefined}>Theme</span>
          </button>
        </li>
      </ul>
    </nav>
  );
};
