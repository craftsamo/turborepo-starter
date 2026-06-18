import { BackHomeButton } from './components';

export async function GlobalNotFoundContent() {
  return (
    <div className='min-h-[60vh] flex flex-col items-center justify-center px-4 py-16 text-center space-y-6 max-w-2xl mx-auto'>
      <h3 className='text-indigo-600 font-semibold text-sm'>404 Error</h3>
      <h1 className='text-4xl font-semibold sm:text-5xl leading-none'>Page not found</h1>
      <p className='mt-4 text-foreground text-[clamp(1rem,2.8vw,1.125rem)] max-w-xl'>
        Sorry, the page you are looking for could not be found or has been removed.
      </p>
      <div className='flex flex-wrap items-center justify-center gap-3'>
        <BackHomeButton />
      </div>
    </div>
  );
}
