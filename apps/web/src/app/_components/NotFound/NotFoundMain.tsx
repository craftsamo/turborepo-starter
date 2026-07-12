import type { ReactNode } from 'react';

export const NotFoundMain = async ({
  className = '',
  children,
}: {
  className?: string;
  children: ReactNode;
}) => (
  <main
    className={`
      min-h-screen max-w-screen-xl mx-auto px-4 flex items-center justify-start h-screen md:px-8
      ${className}
    `}
  >
    {children}
  </main>
);
