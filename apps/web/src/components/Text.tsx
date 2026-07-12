import type { ComponentProps, ElementType } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@workspace/ui/lib/utils';

const textVariants = cva('leading-7', {
  variants: {
    variant: {
      /** Default paragraph copy. */
      body: 'text-base',
      /** De-emphasized secondary copy. */
      muted: 'text-base text-muted-foreground',
      /** Larger supporting text under a heading. */
      lead: 'text-base text-muted-foreground sm:text-lg',
    },
  },
  defaultVariants: {
    variant: 'body',
  },
});

type TextProps = ComponentProps<'p'> &
  VariantProps<typeof textVariants> & {
    /** Semantic tag to render (e.g. 'span'). Defaults to 'p'. */
    as?: ElementType;
  };

/**
 * Body text with the app's shared tone variants, so copy color and rhythm come
 * from one place instead of ad-hoc `text-*` utilities on each page.
 */
export const Text = ({ as: Tag = 'p', variant, className, ...props }: TextProps) => (
  <Tag className={cn(textVariants({ variant }), className)} {...props} />
);
