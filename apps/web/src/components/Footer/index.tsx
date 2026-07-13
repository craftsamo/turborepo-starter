import Link from 'next/link';
import { Github } from 'lucide-react';
import { Container } from '../Container';
import { HStack } from '../Stack';

/**
 * Minimal app footer. Composed by a route-group layout (e.g. `(app)/layout.tsx`).
 */
export const Footer = () => (
  <footer className='border-t py-3'>
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
