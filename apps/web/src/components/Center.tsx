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
 * Compose it instead of repeating `flex items-center justify-center`. Use
 * `min='screen'` for a standalone full-viewport frame, and `asChild` to project
 * the layout onto a semantic element (e.g. `<Center asChild><section>`). Inside
 * the app shell, `Section` owns page-mode height while `Center` only aligns its
 * contents.
 */
export const Center = ({ axis, min, asChild = false, className, ...props }: CenterProps) => {
  const Comp = asChild ? Slot : 'div';
  return (
    <Comp data-slot='center' className={cn(centerVariants({ axis, min }), className)} {...props} />
  );
};
