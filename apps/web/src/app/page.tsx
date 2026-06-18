import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@workspace/ui/components/button';
import { Section } from './components';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Home',
    description:
      'Boilerplate for streamlined development of Turborepo applications with best practices and curated configurations.',
  };
}

export default async function RootPage() {
  return (
    <div className='scroll-smooth'>
      <main
        className={` 
          h-[calc(100svh-4rem)] px-2 
          snap-y overflow-y-auto snap-mandatory no-scrollbar
        `}
      >
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
      </main>
    </div>
  );
}
