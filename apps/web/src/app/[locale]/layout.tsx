import { hasLocale, NextIntlClientProvider } from 'next-intl';
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import NextTopLoader from 'nextjs-toploader';
import type { LayoutProps } from '@workspace/types/web';
import { Toaster } from '@workspace/ui/components/sonner';
import '@workspace/ui/globals.css';
import { ReduxToolProvider, ThemeProvider } from '@/components/Providers';
import { baseUrl } from '@/i18n/metadata';
import { routing } from '@/i18n/routing';

const fontSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const viewport: Viewport = {
  viewportFit: 'cover',
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LayoutProps<{ locale: string }>): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) return {};

  const t = await getTranslations({ locale, namespace: 'site' });

  return {
    metadataBase: new URL(baseUrl),
    applicationName: t('name'),
    title: {
      default: t('name'),
      template: `%s | ${t('name')}`,
    },
    description: t('description'),
    manifest: `/${locale}/manifest.webmanifest`,
    other: {
      repository: 'https://github.com/craftsamo/turborepo-starter',
    },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<{ locale: string }>) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased overflow-hidden`}
      >
        <ReduxToolProvider>
          <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
            <NextIntlClientProvider>{children}</NextIntlClientProvider>
            <NextTopLoader color='var(--primary)' height={2} shadow={false} showSpinner={false} />
            <Toaster mobileOffset={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }} />
          </ThemeProvider>
        </ReduxToolProvider>
      </body>
    </html>
  );
}
