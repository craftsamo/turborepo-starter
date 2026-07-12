'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';

export const BackHomeButton = ({ className = '' }: { className?: string }) => (
  <Button asChild className={className}>
    <Link href='/' aria-label='Back to home'>
      <ArrowLeft className='size-4' />
      Back To Home
    </Link>
  </Button>
);
