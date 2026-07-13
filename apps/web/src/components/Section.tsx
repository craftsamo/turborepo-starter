import type { ComponentProps } from 'react';
import { cn } from '@workspace/ui/lib/utils';

/**
 * Semantic page section whose height and snap behavior follow its parent
 * `Screen` mode.
 *
 * In the default `flow` mode it has natural height and standard vertical
 * padding. `full` makes it fill the visible scroll region, while `snap` adds a
 * snap point. Content composition remains explicit (`Container`, `VStack`,
 * `Center`, etc.), so this primitive owns no headings or page-specific layout.
 */
export const Section = ({ className, ...props }: ComponentProps<'section'>) => (
  <section
    data-slot='section'
    className={cn(
      'flex w-full flex-col py-16 sm:py-24',
      'group-data-[mode=full]/screen:min-h-full group-data-[mode=full]/screen:shrink-0',
      'group-data-[mode=snap]/screen:min-h-full group-data-[mode=snap]/screen:shrink-0',
      'group-data-[mode=snap]/screen:snap-start',
      className,
    )}
    {...props}
  />
);
