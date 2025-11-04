import { Geist_Mono, Inter } from 'next/font/google';
import type { Metadata } from 'next';
import '@workspace/ui/globals.css';
import Favicon from '../../public/image/logo.svg';
import { ThemeProvider } from '@/components/Providers';
import { GlobalNotFoundContent } from './(global-not-found)';

const inter = Inter({ subsets: ['latin'] });

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: '404 | Page Not Found',
    description: 'The page you are looking for does not exist.',
    icons: [
      { rel: 'icon', type: 'image/png', sizes: '64x64', url: Favicon.src },
      { rel: 'apple-touch-icon', type: 'image/png', sizes: '64x64', url: Favicon.src },
    ],
  };
}

export default async function GlobalNotFound() {
  return (
    <html lang='en' suppressHydrationWarning className={inter.className}>
      <body className={`${fontMono.variable} font-mono antialiased`}>
        <ThemeProvider attribute='class' defaultTheme='system'>
          <main className='min-h-screen max-w-screen-xl mx-auto px-4 flex items-center justify-start h-screen md:px-8'>
            <GlobalNotFoundContent />
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
