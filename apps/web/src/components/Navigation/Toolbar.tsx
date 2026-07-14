import Image from 'next/image';
import Link from 'next/link';
import { cva } from 'class-variance-authority';
import { Button } from '@workspace/ui/components/button';
import { cn } from '@workspace/ui/lib/utils';
import Logo from '../../../public/image/logo.svg';
import { Container } from '../Container';
import { HStack } from '../Stack';
import { navItems } from './items';
import { navigationSurfaceVariants } from './styles';
import { ThemeToggle } from './ThemeToggle';
import type { NavigationVariantProps } from './types';

const toolbarVariants = cva('relative z-40 hidden sm:block', {
  variants: {
    variant: {
      docked: 'border-b',
      floating: 'fixed inset-x-0 top-6',
    },
  },
  defaultVariants: {
    variant: 'docked',
  },
});

const toolbarSurfaceVariants = cva('h-12', {
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
 * Top toolbar shown from the `sm` breakpoint up. Docked mode stays in the
 * app-shell flow while floating mode overlays the viewport as an inset Liquid
 * Glass surface. Hidden on mobile, where the `BottomNav` takes over.
 */
export const Toolbar = ({ variant = 'docked' }: NavigationVariantProps) => (
  <header
    className={cn(
      toolbarVariants({ variant }),
      variant === 'docked' && navigationSurfaceVariants({ variant }),
    )}
    data-variant={variant}
  >
    <Container>
      <HStack
        asChild
        justify='between'
        className={cn(
          toolbarSurfaceVariants({ variant }),
          variant === 'floating' && navigationSurfaceVariants({ variant }),
          variant === 'floating' &&
            'bg-background/85 from-white/45 to-white/10 shadow-[0_12px_40px_rgba(15,23,42,0.2)] dark:bg-secondary/80 dark:from-white/14 dark:to-white/5 dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)]',
        )}
      >
        <nav aria-label='Primary'>
          <Link
            href='/'
            className='flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-accent'
          >
            <Image className='size-5' src={Logo} alt='turborepo-starter-logo' />
            <p className='text-base font-bold'>Turborepo Starter</p>
          </Link>

          <HStack gap={1}>
            {navItems
              .filter((item) => item.href !== '/')
              .map((item) => (
                <Button key={item.href} asChild variant='ghost' size='sm'>
                  <Link
                    href={item.href}
                    {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    {item.label}
                  </Link>
                </Button>
              ))}
            <ThemeToggle />
          </HStack>
        </nav>
      </HStack>
    </Container>
  </header>
);
