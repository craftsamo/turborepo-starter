import { type Metadata } from 'next';
import type { LayoutProps } from '@workspace/types/web';
import { GalleryVerticalEnd } from '@/components/Icon';

export const metadata: Metadata = {
  title: 'Login | Turborepo Starter',
  description: 'Login Turborepo Starter Next.js App',
};

export default async function LoginPageLayout(props: LayoutProps) {
  return (
    <div className='flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10'>
      <div className='flex w-full max-w-sm flex-col gap-6'>
        <a href='#' className='flex items-center gap-2 self-center font-medium'>
          <div className='flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground'>
            <GalleryVerticalEnd className='size-4' />
          </div>
          Turborepo Starter Inc.
        </a>
        {props.children}
      </div>
    </div>
  );
}
