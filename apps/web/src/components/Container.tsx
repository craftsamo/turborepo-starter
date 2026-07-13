import type { ComponentProps } from 'react';
import { cn } from '@workspace/ui/lib/utils';

/**
 * Centered page container that owns the app's max width and horizontal padding.
 *
 * This is the single source of truth for content width — compose it instead of
 * repeating `mx-auto max-w-* px-*` in individual routes, so every page lines up
 * on the same measure.
 */
export const Container = ({ className, ...props }: ComponentProps<'div'>) => (
  <div className={cn('mx-auto w-full max-w-6xl px-6 sm:px-8 lg:px-12', className)} {...props} />
);
