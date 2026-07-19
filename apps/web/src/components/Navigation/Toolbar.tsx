import Image from 'next/image';
import { cva } from 'class-variance-authority';
import { getTranslations } from 'next-intl/server';
import { Button } from '@workspace/ui/components/button';
import { cn } from '@workspace/ui/lib/utils';
import Logo from '../../../public/image/logo.svg';
import { Link } from '@/i18n/navigation';
import { Container } from '../Container';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { HStack } from '../Stack';
import { ThemeToggle } from '../Theme';
import { navItems } from './items';
import { navigationSurfaceVariants } from './styles';
import { ToolbarLink } from './ToolbarLink';
import type { NavigationVariantProps } from './types';

const toolbarVariants = cva('relative z-40', {
  variants: {
    variant: {
      docked: 'border-b pt-[env(safe-area-inset-top)]',
      floating: 'fixed inset-x-0 top-[calc(1.5rem+env(safe-area-inset-top))]',
    },
  },
  defaultVariants: {
    variant: 'docked',
  },
});

const toolbarSurfaceVariants = cva('h-12 sm:h-16', {
  variants: {
    variant: {
      docked: '',
      floating: 'rounded-full px-2',
    },
  },
  defaultVariants: {
    variant: 'docked',
  },
});

/**
 * Top bar shown on every viewport. It always carries the logo, and from the
 * `sm` breakpoint up the primary navigation and the language and theme
 * controls, which the `BottomNav` takes over on mobile. Docked mode stays in
 * the app-shell flow while floating mode overlays the viewport as an inset
 * capsule. `surface` picks an opaque or a glass fill. Both modes clear the top
 * safe-area inset, which `viewport-fit=cover` lets the page reach on notched
 * devices.
 */
export const Toolbar = async ({
  variant = 'docked',
  surface = 'solid',
}: NavigationVariantProps) => {
  const t = await getTranslations('navigation');

  return (
    <header
      className={cn(
        toolbarVariants({ variant }),
        variant === 'docked' && navigationSurfaceVariants({ variant, surface }),
      )}
      data-variant={variant}
    >
      <Container>
        <HStack
          asChild
          justify='between'
          className={cn(
            toolbarSurfaceVariants({ variant }),
            variant === 'floating' && navigationSurfaceVariants({ variant, surface }),
          )}
        >
          <div>
            <Link
              href='/'
              className={cn(
                'flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                variant === 'docked' && '-ml-2',
              )}
            >
              <Image className='size-5' src={Logo} alt={t('logoAlt')} />
              <p className='text-base font-bold'>Turborepo Starter</p>
            </Link>

            <HStack gap={1} className={cn('hidden sm:flex', variant === 'docked' && '-mr-2')}>
              <HStack asChild gap={1}>
                <nav aria-label={t('primary')}>
                  {navItems
                    .filter((item) => item.href !== '/')
                    .map((item) => (
                      <Button key={item.href} asChild variant='ghost' size='sm'>
                        <ToolbarLink
                          href={item.href}
                          label={t(item.label)}
                          external={item.external}
                        />
                      </Button>
                    ))}
                </nav>
              </HStack>
              <LanguageSwitcher mode='toolbar' />
              <ThemeToggle />
            </HStack>
          </div>
        </HStack>
      </Container>
    </header>
  );
};
