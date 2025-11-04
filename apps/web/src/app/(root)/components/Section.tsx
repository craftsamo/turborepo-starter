'use server';

import type { JSX } from 'react';

export interface SectionProps {
  id: string;
  className?: string;
  title?: string;
  description?: string;
  children: JSX.Element | JSX.Element[];
}

export const Section = async ({ id, className = '', title, description, children }: SectionProps) => (
  <section id={id} className={`flex flex-col min-h-[calc(100svh-4rem)] items-start snap-start snap-always ${className}`}>
    {title && <h1 className='text-[clamp(1.5rem,6vw,2.25rem)] font-semibold'>{title}</h1>}
    {description && <p className='mt-4 max-w-sm md:max-w-xl text-[clamp(1rem,2.8vw,1.125rem)] text-foreground'>{description}</p>}
    {children}
  </section>
);
