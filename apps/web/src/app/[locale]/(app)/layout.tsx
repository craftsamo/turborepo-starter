import type { LayoutProps } from '@workspace/types/web';
import { BottomNav, Toolbar, type NavigationVariant } from '@/components/Navigation';

const navigationVariant: NavigationVariant = 'floating';

/**
 * Layout for the main app route group.
 *
 * Owns the page chrome as an app shell: a fixed-height flex column that never
 * scrolls, with the `Toolbar` (sm+) pinned at the top, the `BottomNav` (mobile)
 * pinned at the bottom. Each page (or a nested route-group layout) owns the
 * `Screen` between them so it can choose `flow`, `full`, or `snap` behavior and
 * place its `Footer` explicitly. Route groups without chrome (e.g. auth) omit
 * this layout.
 * @param {LayoutProps} props - The layout properties.
 */
export default async function AppLayout(props: LayoutProps) {
  return (
    <div className='flex h-svh flex-col overflow-hidden'>
      <Toolbar variant={navigationVariant} />
      {props.children}
      <BottomNav variant={navigationVariant} />
    </div>
  );
}
