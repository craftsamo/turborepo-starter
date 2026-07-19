import type { LayoutProps } from '@workspace/types/web';
import {
  BottomNav,
  Toolbar,
  type NavigationLabels,
  type NavigationSurface,
  type NavigationVariant,
} from '@/components/Navigation';

/** The top bar stays attached to the edge; on mobile it carries only the logo. */
const toolbarVariant: NavigationVariant = 'docked';
/** The mobile bottom bar floats over the page. */
const bottomNavVariant: NavigationVariant = 'floating';
/** System-style glass, like the iOS tab bar. */
const bottomNavSurface: NavigationSurface = 'glass';
/** Tab labels under the icons, like the iOS tab bar; `hidden` makes an icon-only bar. */
const bottomNavLabels: NavigationLabels = 'visible';

/**
 * Layout for the main app route group.
 *
 * Owns the page chrome as an app shell: a fixed-height flex column that never
 * scrolls, with the `Toolbar` pinned at the top on every viewport and the
 * `BottomNav` (mobile) pinned at the bottom. Each page (or a nested route-group
 * layout) owns the `Screen` between them so it can choose `flow`, `full`, or
 * `snap` behavior and place its `Footer` explicitly. Route groups without
 * chrome (e.g. auth) omit this layout.
 * @param {LayoutProps} props - The layout properties.
 */
export default async function AppLayout(props: LayoutProps) {
  return (
    <div className='flex h-svh flex-col overflow-hidden'>
      <Toolbar variant={toolbarVariant} />
      {props.children}
      <BottomNav variant={bottomNavVariant} surface={bottomNavSurface} labels={bottomNavLabels} />
    </div>
  );
}
