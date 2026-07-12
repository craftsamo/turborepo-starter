import type { ComponentProps } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@workspace/ui/lib/utils';

const centerVariants = cva('flex', {
  variants: {
    /** Which axis to center content on. */
    axis: {
      both: 'items-center justify-center',
      x: 'justify-center',
      y: 'items-center',
    },
    /** Minimum height of the centering frame. */
    min: {
      none: '',
      /** Full viewport height. */
      screen: 'min-h-svh',
      /** Viewport height minus the header (set by the route-group layout). */
      section: 'min-h-[calc(100svh-var(--header-height,0px))]',
    },
  },
  defaultVariants: {
    axis: 'both',
    min: 'none',
  },
});

type CenterProps = ComponentProps<'div'> &
  VariantProps<typeof centerVariants> & {
    /** Render as the single child element (Radix `Slot`) instead of a `div`. */
    asChild?: boolean;
  };

/**
 * Centering frame that places its content on one or both axes.
 *
 * Compose it instead of repeating `flex items-center justify-center`. Use `min`
 * to make it a full-height region (`section` subtracts the header height so a
 * hero fills the viewport below the chrome), and `asChild` to project the frame
 * onto a semantic element (e.g. `<Center asChild min="section"><section>`).
 */
export const Center = ({ axis, min, asChild = false, className, ...props }: CenterProps) => {
  const Comp = asChild ? Slot : 'div';
  return (
    <Comp data-slot='center' className={cn(centerVariants({ axis, min }), className)} {...props} />
  );
};
