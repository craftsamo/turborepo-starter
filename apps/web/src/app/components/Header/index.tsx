'use client';

import Image from 'next/image';
import { type FC, useState } from 'react';
import { Button } from '@workspace/ui/components/button';
import { cn } from '@workspace/ui/lib/utils';
import Logo from '../../../../public/image/logo.svg';
import { ToggleIcon } from './ToggleIcon';

export const Header: FC = () => {
  const [open, setOpen] = useState(false);
  return (
    <header
      className={cn(
        'mt-5 left-0',
        'w-full rounded-lg border shadow',
        'bg-background/95 supports-[backdrop-filter]:bg-background/80 backdrop-blur-lg',
      )}
    >
      <nav className='mx-auto flex items-center justify-between p-1.5'>
        {/* Left: Logo and Title */}
        <div className='hover:none flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 duration-100'>
          <Image className='size-5' src={Logo} alt='sevendao-logo' />
          <p className=' text-base font-bold'>Turborepo Starter</p>
        </div>

        {/* Right: Login button */}
        <div className='flex items-center gap-2 px-2'>
          <Button size='icon' variant='outline' className='md:hidden' onClick={() => setOpen((prev) => !prev)}>
            <ToggleIcon className='size-5' open={open} />
          </Button>
        </div>
      </nav>
    </header>
  );
};
