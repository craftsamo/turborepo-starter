import { cva } from 'class-variance-authority';

/**
 * Defines `--bottom-nav-clearance` on the element it is applied to (the
 * `<body>`) while a floating bottom bar is rendered below `sm`: the space the
 * bar takes from the viewport bottom plus a 0.625rem gap. The bar is theme
 * button 2.75rem + 0.5rem gap + nav 2.75rem (icon-only) or 3.5rem (labels) +
 * 0.5rem padding + 2px border + 1rem offset, so the value is 9rem with labels
 * and 8.25rem icon-only. Unset otherwise, so consumers read it as
 * `var(--bottom-nav-clearance, 0px)`.
 */
export const bottomNavClearance = [
  'max-sm:has-[[data-slot=bottom-bar][data-variant=floating][data-labels=visible]]:[--bottom-nav-clearance:calc(9rem+env(safe-area-inset-bottom))]',
  'max-sm:has-[[data-slot=bottom-bar][data-variant=floating][data-labels=hidden]]:[--bottom-nav-clearance:calc(8.25rem+env(safe-area-inset-bottom))]',
].join(' ');

/**
 * Shared surface treatment so the top and bottom chrome stay visually aligned.
 *
 * `glass` follows the system glass of iOS and macOS: a thin translucent fill
 * of the theme surface over a strong blur that also lifts the colors behind
 * it, one bright rim along the edge with a highlight on the top, and a soft
 * neutral shadow. Where `backdrop-filter` is unsupported it falls back to the
 * opaque fill so text behind it never shows through unblurred.
 */
export const navigationSurfaceVariants = cva('', {
  variants: {
    variant: {
      docked: 'border-border',
      floating: 'border',
    },
    surface: {
      solid: '',
      glass: 'backdrop-blur-2xl backdrop-saturate-[1.8]',
    },
  },
  compoundVariants: [
    { variant: 'docked', surface: 'solid', className: 'bg-background' },
    {
      variant: 'docked',
      surface: 'glass',
      className: 'bg-background supports-[backdrop-filter]:bg-background/80',
    },
    {
      variant: 'floating',
      surface: 'solid',
      className:
        'bg-card shadow-[0_8px_24px_rgb(0_0_0/0.10)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_8px_24px_rgb(0_0_0/0.5)]',
    },
    {
      variant: 'floating',
      surface: 'glass',
      className:
        'border-white/60 bg-card supports-[backdrop-filter]:bg-card/45 shadow-[inset_0_1px_0_rgb(255_255_255/0.8),0_8px_32px_rgb(0_0_0/0.12)] dark:border-white/[0.12] dark:supports-[backdrop-filter]:bg-card/40 dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_8px_32px_rgb(0_0_0/0.5)]',
    },
  ],
  defaultVariants: {
    variant: 'docked',
    surface: 'solid',
  },
});
