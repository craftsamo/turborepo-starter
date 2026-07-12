import type { JSX } from 'react';
import { cn } from '@workspace/ui/lib/utils';
import { Container, Heading, Text } from '@/components';

export interface SectionProps {
  id: string;
  className?: string;
  title?: string;
  description?: string;
  children: JSX.Element | JSX.Element[];
}

export const Section = ({ id, className = '', title, description, children }: SectionProps) => (
  <section
    id={id}
    className='flex min-h-[calc(100svh-var(--header-height,0px))] snap-start snap-always'
  >
    <Container className={cn('flex flex-1 flex-col items-start', className)}>
      {title && <Heading>{title}</Heading>}
      {description && (
        <Text variant='lead' className='mt-4 max-w-sm md:max-w-xl'>
          {description}
        </Text>
      )}
      {children}
    </Container>
  </section>
);
