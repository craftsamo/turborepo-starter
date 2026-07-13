import { cva } from 'class-variance-authority';

/** Shared surface treatment so the top and bottom chrome stay visually aligned. */
export const navigationSurfaceVariants = cva('', {
  variants: {
    variant: {
      docked:
        'border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80',
      floating:
        'border border-white/40 bg-background/55 bg-gradient-to-b from-white/35 to-white/5 shadow-[0_8px_32px_rgba(15,23,42,0.14)] ring-1 ring-black/5 backdrop-blur-2xl backdrop-saturate-150 supports-[backdrop-filter]:bg-background/35 dark:border-white/15 dark:from-white/12 dark:to-white/3 dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] dark:ring-white/10',
    },
  },
  defaultVariants: {
    variant: 'docked',
  },
});
