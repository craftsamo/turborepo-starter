import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import type { LayoutProps } from '@workspace/types/web';
import { Toaster } from '@workspace/ui/components/sonner';
import '@workspace/ui/globals.css';
import { ReduxToolProvider, ThemeProvider } from '@/components/Providers';
import { Header } from './_components';

const baseUrl = process.env.BASE_URL ?? 'http://localhost';
const SITE_NAME = 'Turborepo Starter';
const SITE_DESCRIPTION = 'This is the Turborepo Starter web application.';

const fontSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  applicationName: SITE_NAME,
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
};

/**
 * The root layout component for the application.
 * @param {LayoutProps} props - The layout properties.
 */
export default async function RootLayout(props: LayoutProps) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`}>
        <ReduxToolProvider>
          <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
            <div className='mx-auto w-full max-w-6xl px-6 sm:px-12'>
              <Header />
              {props.children}
            </div>
            <Toaster />
          </ThemeProvider>
        </ReduxToolProvider>
      </body>
    </html>
  );
}
