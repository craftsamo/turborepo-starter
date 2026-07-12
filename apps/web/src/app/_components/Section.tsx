import type { JSX } from 'react';
import { Heading, Text } from '@/components';

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
    className={`flex flex-col min-h-[calc(100svh-4rem)] items-start snap-start snap-always ${className}`}
  >
    {title && <Heading>{title}</Heading>}
    {description && (
      <Text variant='lead' className='mt-4 max-w-sm md:max-w-xl'>
        {description}
      </Text>
    )}
    {children}
  </section>
);
