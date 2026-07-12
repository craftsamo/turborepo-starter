import type { ComponentProps } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@workspace/ui/lib/utils';

const stackVariants = cva('flex', {
  variants: {
    /** Flow direction of the children. */
    direction: {
      row: 'flex-row',
      column: 'flex-col',
    },
    /** Gap between children. */
    gap: {
      1: 'gap-1',
      2: 'gap-2',
      3: 'gap-3',
      4: 'gap-4',
      6: 'gap-6',
      8: 'gap-8',
    },
    /** Cross-axis alignment of children. */
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      baseline: 'items-baseline',
      stretch: 'items-stretch',
    },
    /** Main-axis distribution of children. */
    justify: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
    },
    /** Allow children to wrap onto multiple lines. */
    wrap: { true: 'flex-wrap' },
    /** Stack vertically on small screens, switch to a row from `sm` up. */
    collapse: { true: 'flex-col sm:flex-row' },
  },
  defaultVariants: {
    direction: 'column',
    gap: 4,
  },
});

type StackProps = ComponentProps<'div'> &
  VariantProps<typeof stackVariants> & {
    /** Render as the single child element (Radix `Slot`) instead of a `div`. */
    asChild?: boolean;
  };

/**
 * Flexbox stack primitive that owns the gap and alignment between children.
 *
 * Compose it instead of repeating `flex gap-*` utilities. Reach for the
 * `VStack` / `HStack` presets for the common axes; drop to `Stack` directly
 * only when you need to drive `direction` yourself. Use `asChild` to project
 * the layout onto a semantic element (e.g. `<Stack asChild><ul>`).
 */
export const Stack = ({
  direction,
  gap,
  align,
  justify,
  wrap,
  collapse,
  asChild = false,
  className,
  ...props
}: StackProps) => {
  const Comp = asChild ? Slot : 'div';
  return (
    <Comp
      data-slot='stack'
      className={cn(stackVariants({ direction, gap, align, justify, wrap, collapse }), className)}
      {...props}
    />
  );
};

/**
 * Vertical `Stack` preset: a column that owns the rhythm between stacked
 * children. Compose it instead of repeating `flex flex-col gap-*` / `space-y-*`.
 */
export const VStack = (props: Omit<StackProps, 'direction' | 'collapse'>) => (
  <Stack direction='column' {...props} />
);

/**
 * Horizontal `Stack` preset for laying elements out in a row with a consistent
 * gap (button groups, inline nav, meta rows). Defaults to `align='center'`; use
 * `collapse` for groups that should stack on mobile and `wrap` for clusters.
 */
export const HStack = ({ align = 'center', ...props }: Omit<StackProps, 'direction'>) => (
  <Stack direction='row' align={align} {...props} />
);
