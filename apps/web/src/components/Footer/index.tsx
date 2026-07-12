import Link from 'next/link';
import { Container } from '../Container';

/**
 * Minimal app footer. Composed by a route-group layout (e.g. `(app)/layout.tsx`).
 */
export const Footer = () => (
  <footer className='border-t py-6'>
    <Container className='flex flex-col items-center justify-between gap-2 text-sm text-muted-foreground sm:flex-row'>
      <p>© {new Date().getFullYear()} Turborepo Starter</p>
      <Link
        href='https://github.com/craftsamo/turborepo-starter'
        target='_blank'
        rel='noopener noreferrer'
        className='transition-colors hover:text-foreground'
      >
        GitHub
      </Link>
    </Container>
  </footer>
);
