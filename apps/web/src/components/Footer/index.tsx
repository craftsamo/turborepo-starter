import Link from 'next/link';
import { Github } from 'lucide-react';
import { Container } from '../Container';
import { HStack } from '../Stack';

/**
 * Minimal app footer. Place it explicitly inside the page's `Screen`. On mobile
 * with a floating bottom bar its bottom padding reaches under the bar, so at
 * the end of the page the bar rests on the footer's own surface instead of on
 * an empty band below it.
 */
export const Footer = () => (
  <footer
    data-slot='footer'
    className='shrink-0 snap-end border-t pt-3 pb-[max(0.75rem,var(--bottom-nav-clearance,0px))]'
  >
    <Container>
      <HStack gap={2} justify='between' className='text-sm text-muted-foreground'>
        <p>© {new Date().getFullYear()} Turborepo Starter</p>
        <Link
          href='https://github.com/craftsamo/turborepo-starter'
          target='_blank'
          rel='noopener noreferrer'
          aria-label='GitHub'
          className='transition-colors hover:text-foreground'
        >
          <Github className='size-5' />
        </Link>
      </HStack>
    </Container>
  </footer>
);
