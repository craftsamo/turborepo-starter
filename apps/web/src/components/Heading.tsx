import type { ComponentProps, ElementType } from 'react';
import { cn } from '@workspace/ui/lib/utils';

type HeadingProps = ComponentProps<'h1'> & {
  /** Semantic tag to render (e.g. 'h2') without changing the visual scale. */
  as?: ElementType;
};

/**
 * The app's single canonical heading scale.
 *
 * Every page/section title uses this one responsive scale so headings never
 * drift between routes. Pass `as` to keep the document outline correct
 * (e.g. `as='h2'`) while preserving the look.
 */
export const Heading = ({ as: Tag = 'h1', className, ...props }: HeadingProps) => (
  <Tag
    className={cn('text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl', className)}
    {...props}
  />
);
