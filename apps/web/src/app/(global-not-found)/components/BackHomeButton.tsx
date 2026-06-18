'use client';

import Link from 'next/link';

export const BackHomeButton = ({ className = '' }: { className?: string }) => {
  const onClick = () => {
    window.location.href = '/';
  };

  return (
    <Link
      href='/'
      onClick={onClick}
      className={`
        inline-flex items-center gap-2 rounded-lg px-4 py-2 mt-6
        bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm 
        font-medium shadow-md hover:opacity-95 active:translate-y-0.5
        focus:outline-none focus:ring-2 focus:ring-indigo-400/40
        ${className}
      `}
      aria-label='Back to home'
    >
      <svg className='w-4 h-4' viewBox='0 0 24 24' fill='none' aria-hidden>
        <path
          d='M15 18l-6-6 6-6'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
      Back To Home
    </Link>
  );
};
