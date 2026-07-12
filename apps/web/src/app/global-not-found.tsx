import { Geist, Geist_Mono } from 'next/font/google';
import type { Metadata } from 'next';
import '@workspace/ui/globals.css';
import { Container, Heading, Text } from '@/components';
import { ThemeProvider } from '@/components/Providers';
import { BackHomeButton } from './_components/NotFound';

const baseUrl = process.env.BASE_URL ?? 'http://localhost';

const fontSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
});

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
    <html lang='en' suppressHydrationWarning>
      <body className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`}>
        <ThemeProvider attribute='class' defaultTheme='system'>
          <main className='flex min-h-screen items-center'>
            <Container>
              <div className='min-h-[60vh] flex flex-col items-center justify-center px-4 py-16 text-center space-y-6 max-w-2xl mx-auto'>
                <h3 className='text-primary font-semibold text-sm'>404 Error</h3>
                <Heading>Page not found</Heading>
                <Text variant='lead' className='max-w-xl'>
                  Sorry, the page you are looking for could not be found or has been removed.
                </Text>
                <div className='flex flex-wrap items-center justify-center gap-3'>
                  <BackHomeButton />
                </div>
              </div>
            </Container>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
