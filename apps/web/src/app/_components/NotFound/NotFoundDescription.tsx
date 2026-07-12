import type { ReactNode } from 'react';

export const NotFoundDescription = async ({
  className = '',
  children,
}: {
  className?: string;
  children: ReactNode;
}) => (
  <p
    className={`
      mt-4 text-foreground text-[clamp(1rem,2.8vw,1.125rem)] max-w-xl
      ${className}
    `}
  >
    {children}
  </p>
);
