import { Geist, Geist_Mono } from 'next/font/google';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import '@workspace/ui/globals.css';
import { Button } from '@workspace/ui/components/button';
import { ThemeProvider } from '@/components/Providers';
import { Center, Container, Heading, HStack, Text, VStack } from '@/components';

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
          <Center asChild min='screen'>
            <main>
              <Container>
                <VStack
                  gap={6}
                  align='center'
                  className='mx-auto min-h-[60vh] max-w-2xl justify-center px-4 py-16 text-center'
                >
                  <h3 className='text-sm font-semibold text-primary'>404 Error</h3>
                  <Heading>Page not found</Heading>
                  <Text variant='lead' className='max-w-xl'>
                    Sorry, the page you are looking for could not be found or has been removed.
                  </Text>
                  <HStack wrap justify='center'>
                    <Button asChild>
                      <Link href='/' aria-label='Back to home'>
                        <ArrowLeft className='size-4' />
                        Back To Home
                      </Link>
                    </Button>
                  </HStack>
                </VStack>
              </Container>
            </main>
          </Center>
        </ThemeProvider>
      </body>
    </html>
  );
}
