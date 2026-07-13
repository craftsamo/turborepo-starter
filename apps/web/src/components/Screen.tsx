import type { ComponentProps } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@workspace/ui/lib/utils';

const screenVariants = cva('flex min-h-0 flex-1 flex-col', {
  variants: {
    scroll: {
      /** Normal internal scrolling (default). */
      auto: 'overflow-y-auto',
      /** No scrolling — content is clipped to the region. */
      none: 'overflow-hidden',
      /** Vertical snap scrolling (pairs with each section's `snap-start`). */
      snap: 'overflow-y-auto snap-y snap-mandatory',
    },
    /** Smooth-scroll between anchors/snap points. */
    smooth: { true: 'scroll-smooth' },
    /** Visually hide the scrollbar while keeping the area scrollable. */
    hideScrollbar: { true: 'no-scrollbar' },
  },
  defaultVariants: {
    scroll: 'auto',
  },
});

type ScreenProps = ComponentProps<'main'> & VariantProps<typeof screenVariants>;

/**
 * Scroll region that owns a page's vertical scrolling.
 *
 * It fills the app-shell frame (the route-group layout's `h-svh` flex column)
 * as a `flex-1` child and scrolls internally, so the chrome around it (toolbar,
 * bottom nav) stays pinned. It is itself a flex column, so a `flex-1` page
 * child fills the space above the footer. Every app page (the 404 document is
 * the exception) roots its tree here and opts into behavior via props instead
 * of inheriting it from global CSS.
 */
export const Screen = ({ scroll, smooth, hideScrollbar, className, ...props }: ScreenProps) => (
  <main className={cn(screenVariants({ scroll, smooth, hideScrollbar }), className)} {...props} />
);
