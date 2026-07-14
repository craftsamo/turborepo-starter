'use client';

import type { ComponentProps } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@workspace/ui/lib/utils';

interface ToolbarLinkProps extends Omit<ComponentProps<typeof Link>, 'href'> {
  external?: boolean;
  href: string;
  label: string;
}

export const ToolbarLink = ({ className, external, href, label, ...props }: ToolbarLinkProps) => {
  const pathname = usePathname();
  const active =
    !external && (pathname === href || (href !== '/' && pathname.startsWith(`${href}/`)));

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        className,
        active && 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary',
      )}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...props}
    >
      {label}
    </Link>
  );
};
