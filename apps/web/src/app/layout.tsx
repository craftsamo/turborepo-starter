import { Geist, Geist_Mono } from 'next/font/google';
import type { LayoutProps } from '@workspace/types/web';
import { Toaster } from '@workspace/ui/components/sonner';
import '@workspace/ui/globals.css';
import { ReduxToolProvider, ThemeProvider } from '@/components/Providers';

const fontSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

/**
 * The root layout component for the application.
 * @param {LayoutProps} props - The layout properties.
 */
export default async function RootLayout(props: LayoutProps) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={`${fontSans.variable} ${fontMono.variable} font-mono antialiased`}>
        <ReduxToolProvider>
          <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
            {props.children}
            <Toaster />
          </ThemeProvider>
        </ReduxToolProvider>
      </body>
    </html>
  );
}
