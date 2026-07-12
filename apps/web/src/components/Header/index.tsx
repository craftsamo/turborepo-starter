'use client';

import Image from 'next/image';
import Link from 'next/link';
import { type FC, useEffect, useState } from 'react';
import { Button } from '@workspace/ui/components/button';
import { cn } from '@workspace/ui/lib/utils';
import Logo from '../../../public/image/logo.svg';
import { Container } from '../Container';
import { navLinks } from './links';
import { MobileMenu } from './MobileMenu';
import { ThemeToggle } from './ThemeToggle';
import { ToggleIcon } from './ToggleIcon';

const MOBILE_MENU_ID = 'header-mobile-menu';

/**
 * App header. Composed by a route-group layout (e.g. `(app)/layout.tsx`), not
 * the root layout, so only groups that want chrome render it. Pass `sticky` to
 * pin it to the top of the scroll region.
 */
export const Header: FC<{ sticky?: boolean }> = ({ sticky = false }) => {
  const [open, setOpen] = useState(false);

  // Close the mobile menu with the Escape key.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <Container className={cn(sticky && 'sticky top-0 z-40')}>
      <header
        className={cn(
          'mt-5 w-full rounded-lg border shadow',
          'bg-background/95 supports-[backdrop-filter]:bg-background/80 backdrop-blur-lg',
        )}
      >
        <nav className='mx-auto flex items-center justify-between p-1.5'>
          {/* Left: Logo and Title */}
          <Link
            href='/'
            className='flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-accent'
          >
            <Image className='size-5' src={Logo} alt='turborepo-starter-logo' />
            <p className='text-base font-bold'>Turborepo Starter</p>
          </Link>

          {/* Right: navigation, theme toggle, and mobile trigger */}
          <div className='flex items-center gap-1 px-1'>
            {/* Desktop navigation links */}
            <ul className='hidden items-center gap-1 md:flex'>
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Button asChild variant='ghost' size='sm'>
                    <Link
                      href={link.href}
                      {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    >
                      {link.label}
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>

            <ThemeToggle />

            {/* Mobile menu trigger */}
            <Button
              size='icon'
              variant='outline'
              className='md:hidden'
              aria-label='Toggle navigation menu'
              aria-expanded={open}
              aria-controls={MOBILE_MENU_ID}
              onClick={() => setOpen((prev) => !prev)}
            >
              <ToggleIcon className='size-5' open={open} />
            </Button>
          </div>
        </nav>

        {open && <MobileMenu id={MOBILE_MENU_ID} onNavigate={() => setOpen(false)} />}
      </header>
    </Container>
  );
};
