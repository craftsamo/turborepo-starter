import type { LayoutProps } from '@workspace/types/web';
import { Screen } from '@/components';
import { Footer } from '@/components/Footer';
import { BottomNav, Toolbar, type NavigationVariant } from '@/components/Navigation';

const navigationVariant: NavigationVariant = 'floating';

/**
 * Layout for the main app route group.
 *
 * Owns the page chrome as an app shell: a fixed-height flex column that never
 * scrolls, with the `Toolbar` (sm+) pinned at the top, the `BottomNav` (mobile)
 * pinned at the bottom, and a `Screen` scroll region in between that holds the
 * page and the `Footer`. Route groups without chrome (e.g. auth) omit this
 * layout.
 * @param {LayoutProps} props - The layout properties.
 */
export default async function AppLayout(props: LayoutProps) {
  return (
    <div className='flex h-svh flex-col overflow-hidden'>
      <Toolbar variant={navigationVariant} />
      <Screen scroll='auto' smooth hideScrollbar>
        {props.children}
        <Footer />
      </Screen>
      <BottomNav variant={navigationVariant} />
    </div>
  );
}
