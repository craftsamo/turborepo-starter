import type { ReactNode } from 'react';

export const NotFoundTitle = async ({
  className = '',
  children,
}: {
  className?: string;
  children: ReactNode;
}) => (
  <h1
    className={`
      text-4xl font-semibold sm:text-5xl leading-none
      ${className}
    `}
  >
    {children}
  </h1>
);
