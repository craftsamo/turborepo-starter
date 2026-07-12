import Link from 'next/link';
import { Container } from '../Container';
import { HStack } from '../Stack';

/**
 * Minimal app footer. Composed by a route-group layout (e.g. `(app)/layout.tsx`).
 */
export const Footer = () => (
  <footer className='border-t py-6'>
    <Container>
      <HStack collapse gap={2} justify='between' className='text-sm text-muted-foreground'>
        <p>© {new Date().getFullYear()} Turborepo Starter</p>
        <Link
          href='https://github.com/craftsamo/turborepo-starter'
          target='_blank'
          rel='noopener noreferrer'
          className='transition-colors hover:text-foreground'
        >
          GitHub
        </Link>
      </HStack>
    </Container>
  </footer>
);
