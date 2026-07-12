import type { CSSProperties } from 'react';
import type { LayoutProps } from '@workspace/types/web';
import { Screen } from '@/components';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';

/**
 * Layout for the main app route group.
 *
 * Owns the page chrome: a `Screen` scroll region with the `Header` and
 * `Footer`. Exposes `--header-height` so full-height sections subtract the
 * header. Route groups without chrome (e.g. auth) simply omit this layout.
 * @param {LayoutProps} props - The layout properties.
 */
export default async function AppLayout(props: LayoutProps) {
  return (
    <Screen
      scroll='auto'
      smooth
      hideScrollbar
      style={{ '--header-height': '4rem' } as CSSProperties}
    >
      <Header />
      {props.children}
      <Footer />
    </Screen>
  );
}
