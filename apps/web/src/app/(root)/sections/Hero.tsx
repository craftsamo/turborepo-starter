'use server';

import Link from 'next/link';
import { Button } from '@workspace/ui/components/button';
import { Section } from '../components';

export const HeroSection = async () => {
  return (
    <Section
      id='hero'
      title='Turborepo Starter'
      description='Boilerplate for streamlined development of Turborepo applications with best practices and curated configurations.'
      className='items-center sm:items-start justify-center max-[375px]:items-start'
    >
      <div className='flex flex-col sm:flex-row mt-6 gap-6 sm:gap-3'>
        <Button asChild className='w-full sm:w-auto h-10 sm:h-9'>
          <Link
            href='https://github.com/craftsamo/turborepo-starter'
            target='_blank'
            rel='noopener noreferrer'
          >
            Getting Start
          </Link>
        </Button>
      </div>
    </Section>
  );
};
