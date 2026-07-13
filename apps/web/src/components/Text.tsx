import type { ComponentProps, ElementType } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@workspace/ui/lib/utils';

const textVariants = cva('leading-7', {
  variants: {
    variant: {
      /** Default paragraph copy. */
      body: 'text-pretty text-base',
      /** De-emphasized secondary copy. */
      muted: 'text-pretty text-base text-muted-foreground',
      /** Larger supporting text under a heading. */
      lead: 'text-pretty text-base text-muted-foreground sm:text-lg',
      /** Small accent label above a heading (kicker/overline). */
      eyebrow: 'text-sm font-semibold text-primary',
    },
    /**
     * Maximum line length. `ch` scales with the font size, so the measure
     * stays readable across the responsive type scale.
     */
    measure: {
      none: '',
      /** Comfortable reading measure (~65 characters). */
      prose: 'max-w-[65ch]',
    },
  },
  defaultVariants: {
    variant: 'body',
    measure: 'none',
  },
});

type TextProps = ComponentProps<'p'> &
  VariantProps<typeof textVariants> & {
    /** Semantic tag to render (e.g. 'span'). Defaults to 'p'. */
    as?: ElementType;
  };

/**
 * Body text with the app's shared tone variants, so copy color and rhythm come
 * from one place instead of ad-hoc `text-*` utilities on each page. Use
 * `measure` to constrain line length instead of hand-picked `max-w-*` values.
 */
export const Text = ({ as: Tag = 'p', variant, measure, className, ...props }: TextProps) => (
  <Tag className={cn(textVariants({ variant, measure }), className)} {...props} />
);
