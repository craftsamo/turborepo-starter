import type { ComponentProps, ElementType } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@workspace/ui/lib/utils';

const headingVariants = cva('text-balance font-semibold tracking-tight', {
  variants: {
    /** Visual step on the canonical heading scale (independent of the tag). */
    level: {
      /** Page title. */
      1: 'text-3xl sm:text-4xl md:text-5xl',
      /** Section title. */
      2: 'text-2xl sm:text-3xl',
      /** Subsection title. */
      3: 'text-xl sm:text-2xl',
    },
  },
  defaultVariants: {
    level: 1,
  },
});

type HeadingProps = ComponentProps<'h1'> &
  VariantProps<typeof headingVariants> & {
    /** Semantic tag to render (e.g. 'h2') without changing the visual scale. */
    as?: ElementType;
  };

/**
 * The app's canonical heading scale.
 *
 * Every page/section title picks a `level` on this one responsive scale so
 * headings never drift between routes. `level` controls only the visual step;
 * pass `as` to keep the document outline correct (e.g. `as='h2'`)
 * independently of the look.
 */
export const Heading = ({ as: Tag = 'h1', level, className, ...props }: HeadingProps) => (
  <Tag className={cn(headingVariants({ level }), className)} {...props} />
);
