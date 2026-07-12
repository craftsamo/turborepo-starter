'use client';

import Link from 'next/link';
import { navLinks } from './links';

/**
 * The collapsible navigation panel shown under the header on small screens.
 */
export const MobileMenu = ({ id, onNavigate }: { id: string; onNavigate: () => void }) => (
  <div id={id} className='border-t p-2 md:hidden'>
    <ul className='flex flex-col gap-1'>
      {navLinks.map((link) => (
        <li key={link.href}>
          <Link
            href={link.href}
            onClick={onNavigate}
            {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className='block rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground'
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);
