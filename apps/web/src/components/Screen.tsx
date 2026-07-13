import type { ComponentProps } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@workspace/ui/lib/utils';

const screenVariants = cva('flex min-h-0 flex-1 flex-col', {
  variants: {
    mode: {
      /** Natural-height sections with normal internal scrolling (default). */
      flow: 'overflow-y-auto',
      /** Full-height sections with normal internal scrolling. */
      full: 'overflow-y-auto',
      /** Full-height sections with mandatory vertical snap scrolling. */
      snap: 'overflow-y-auto snap-y snap-mandatory',
    },
    /** Smooth-scroll between anchors/snap points. */
    smooth: { true: 'scroll-smooth' },
    /** Visually hide the scrollbar while keeping the area scrollable. */
    hideScrollbar: { true: 'no-scrollbar' },
  },
  defaultVariants: {
    mode: 'flow',
  },
});

type ScreenProps = ComponentProps<'main'> & VariantProps<typeof screenVariants>;

/**
 * Page scroll region that owns vertical scrolling and section behavior.
 *
 * It fills the app-shell frame (the route-group layout's `h-svh` flex column)
 * as a `flex-1` child and scrolls internally, so the chrome around it (toolbar,
 * bottom nav) stays pinned. It is itself a flex column, so a `flex-1` page
 * child fills the space above the footer. Every app page (the 404 document is
 * the exception) roots its tree here. `mode` defaults to natural document flow;
 * `full` and `snap` make descendant `Section` primitives fill this region,
 * with `snap` also enabling mandatory scroll snapping.
 */
export const Screen = ({ mode, smooth, hideScrollbar, className, ...props }: ScreenProps) => (
  <main
    data-mode={mode ?? 'flow'}
    className={cn(
      'group/screen',
      screenVariants({ mode, smooth, hideScrollbar }),
      className,
    )}
    {...props}
  />
);
