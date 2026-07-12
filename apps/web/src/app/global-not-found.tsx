import { Geist_Mono, Inter } from 'next/font/google';
import type { Metadata } from 'next';
import '@workspace/ui/globals.css';
import { ThemeProvider } from '@/components/Providers';
import {
  BackHomeButton,
  NotFoundDescription,
  NotFoundMain,
  NotFoundTitle,
} from './_components/NotFound';

const baseUrl = process.env.BASE_URL ?? 'http://localhost';

const inter = Inter({ subsets: ['latin'] });

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL(baseUrl),
    title: '404 | Page Not Found',
    description: 'The page you are looking for does not exist.',
  };
}

export default async function GlobalNotFound() {
  return (
    <html lang='en' suppressHydrationWarning className={inter.className}>
      <body className={`${fontMono.variable} font-mono antialiased`}>
        <ThemeProvider attribute='class' defaultTheme='system'>
          <NotFoundMain>
            <div className='min-h-[60vh] flex flex-col items-center justify-center px-4 py-16 text-center space-y-6 max-w-2xl mx-auto'>
              <h3 className='text-indigo-600 font-semibold text-sm'>404 Error</h3>
              <NotFoundTitle>Page not found</NotFoundTitle>
              <NotFoundDescription>
                Sorry, the page you are looking for could not be found or has been removed.
              </NotFoundDescription>
              <div className='flex flex-wrap items-center justify-center gap-3'>
                <BackHomeButton />
              </div>
            </div>
          </NotFoundMain>
        </ThemeProvider>
      </body>
    </html>
  );
}
