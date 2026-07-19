'use client';

import { Moon, Sun } from 'lucide-react';
import { cva } from 'class-variance-authority';
import { useTranslations } from 'next-intl';
import { cn } from '@workspace/ui/lib/utils';
import { Link, usePathname } from '@/i18n/navigation';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { useThemeToggle } from '../Theme';
import { navItems } from './items';
import { navigationSurfaceVariants } from './styles';
import type { BottomNavProps } from './types';
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
        docked: '',
        floating: 'rounded-full',
      },
      labels: {
        visible: '',
        hidden: '',
      },
      active: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      { variant: 'docked', className: 'h-12' },
      { variant: 'floating', labels: 'visible', className: 'h-14 gap-0.5' },
      { variant: 'floating', labels: 'hidden', className: 'h-11' },
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
          'bg-foreground/[0.07] text-primary dark:bg-primary/25 dark:text-foreground',
      },
      {
        variant: 'floating',
        active: false,
        className: 'text-foreground/80 hover:text-foreground',
      },
    ],
    defaultVariants: {
      variant: 'docked',
      labels: 'visible',
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
 * floating. The language switch, named in the other language's own script, and
 * the theme toggle are not destinations, so they sit outside the nav: above it
 * on glass buttons (a pill and a round button) when floating, at the end of the
 * row when docked. Docked stays in the app-shell flow; floating overlays the
 * page. Both honor the safe-area inset and are hidden from `sm` up, where the
 * `Toolbar` takes over. When floating it slides away while the page scrolls
 * down and returns on scroll up, at either end of the page and when focus
 * enters it (see `useHideOnScroll`); it stays on screen while focus is inside
 * it. `labels` hides the tab text (kept as accessible names) for a compact
 * icon-only bar.
 */
export const BottomNav = ({
  variant = 'docked',
  surface = 'solid',
  labels = 'visible',
}: BottomNavProps) => {
  const pathname = usePathname();
  const { toggle } = useThemeToggle();
  const t = useTranslations('navigation');
  const { hidden, show } = useHideOnScroll(pathname);
  const slidAway = variant === 'floating' && hidden;

  return (
    <div
      data-slot='bottom-bar'
      data-variant={variant}
      data-labels={labels}
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
        <div className='flex gap-2'>
          <LanguageSwitcher
            mode='bottom'
            className={cn(
              toolVariants(),
              navigationSurfaceVariants({ variant, surface }),
              'h-11 gap-2 px-4 text-sm',
            )}
          />
          <button
            type='button'
            onClick={toggle}
            aria-label={t('toggleTheme')}
            className={cn(
              toolVariants(),
              navigationSurfaceVariants({ variant, surface }),
              'size-11',
            )}
          >
            <ThemeIcons />
          </button>
        </div>
      )}
      <nav
        aria-label={t('primary')}
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
                  className={tabVariants({ variant, labels, active })}
                >
                  <Icon aria-hidden='true' className='size-5' />
                  <span className={labels === 'hidden' ? 'sr-only' : undefined}>
                    {t(item.label)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {variant === 'docked' && (
        <>
          <LanguageSwitcher
            mode='bottom'
            hideLabel={labels === 'hidden'}
            className={cn(tabVariants({ variant, labels }), 'w-20 shrink-0')}
          />
          <button
            type='button'
            onClick={toggle}
            aria-label={t('toggleTheme')}
            className={cn(
              tabVariants({ variant, labels }),
              'w-20 shrink-0 border-0 bg-transparent',
            )}
          >
            <ThemeIcons />
            <span className={labels === 'hidden' ? 'sr-only' : undefined}>{t('theme')}</span>
          </button>
        </>
      )}
    </div>
  );
};
