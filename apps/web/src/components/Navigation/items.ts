import type { LucideIcon } from 'lucide-react';
import { GalleryVerticalEnd, Github, Home } from 'lucide-react';

export interface NavItem {
  /** Visible label and accessible name. */
  label: string;
  /** Destination. Internal routes drive the active state. */
  href: string;
  /** Icon shown in the bottom navigation. */
  icon: LucideIcon;
  /** External links open in a new tab and never mark as active. */
  external?: boolean;
}

/** Primary navigation destinations, shared by the toolbar and bottom nav. */
export const navItems: NavItem[] = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Showcase', href: '/showcase', icon: GalleryVerticalEnd },
  {
    label: 'GitHub',
    href: 'https://github.com/craftsamo/turborepo-starter',
    icon: Github,
    external: true,
  },
];
