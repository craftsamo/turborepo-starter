import type { ReactNode } from 'react';
import { Container } from '@/components';

export const NotFoundMain = async ({
  className = '',
  children,
}: {
  className?: string;
  children: ReactNode;
}) => (
  <main className='flex min-h-screen items-center'>
    <Container className={className}>{children}</Container>
  </main>
);
