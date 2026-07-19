'use client';

import { cn } from '@workspace/ui/lib/utils';
import { Link, usePathname } from '@/i18n/navigation';

interface ToolbarLinkProps {
  className?: string;
  external?: boolean;
  href: string;
  label: string;
}

export const ToolbarLink = ({ className, external, href, label }: ToolbarLinkProps) => {
  const pathname = usePathname();
  const active =
    !external && (pathname === href || (href !== '/' && pathname.startsWith(`${href}/`)));

  const linkClassName = cn(
    className,
    active && 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary',
  );

  if (external) {
    return (
      <a href={href} target='_blank' rel='noopener noreferrer' className={linkClassName}>
        {label}
      </a>
    );
  }

  return (
    <Link href={href} aria-current={active ? 'page' : undefined} className={linkClassName}>
      {label}
    </Link>
  );
};
