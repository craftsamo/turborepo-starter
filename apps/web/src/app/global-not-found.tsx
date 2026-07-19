import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ArrowLeft } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { Button } from '@workspace/ui/components/button';
import '@workspace/ui/globals.css';
import { Center, Container, Heading, HStack, Text, VStack } from '@/components';
import { ThemeProvider } from '@/components/Providers';
import { baseUrl } from '@/i18n/metadata';

const fontSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');

  return {
    metadataBase: new URL(baseUrl),
    title: t('notFoundTitle'),
    description: t('notFoundDescription'),
    robots: { index: false, follow: false },
  };
}

export default async function GlobalNotFound() {
  const locale = await getLocale();
  const t = await getTranslations('notFound');

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`}>
        <ThemeProvider attribute='class' defaultTheme='system'>
          <Center asChild min='screen'>
            <main>
              <Container>
                <VStack gap={6} align='center' className='text-center'>
                  <Text variant='eyebrow'>{t('eyebrow')}</Text>
                  <Heading>{t('heading')}</Heading>
                  <Text variant='lead' measure='prose'>
                    {t('description')}
                  </Text>
                  <HStack wrap justify='center'>
                    <Button asChild>
                      <a href={`/${locale}`} aria-label={t('backHome')}>
                        <ArrowLeft className='size-4' />
                        {t('backHome')}
                      </a>
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
