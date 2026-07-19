import type { NextRouter } from 'next/router';
import { RouterContext } from 'next/dist/shared/lib/router-context.shared-runtime';
import type { JSXElementConstructor, ReactElement, ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { render } from '@testing-library/react';
import { vi } from 'vitest';
import type { Language } from '@workspace/constants';
import { ReduxToolProvider, ThemeProvider } from '@/components/Providers';
import en from '@/i18n/messages/en.json';
import ja from '@/i18n/messages/ja.json';

const mockRouter: NextRouter = {
  basePath: '',
  pathname: '/',
  route: '/',
  asPath: '/',
  forward: vi.fn(), //noop,
  query: {},
  push: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
  back: vi.fn(),
  prefetch: vi.fn(),
  beforePopState: vi.fn(),
  events: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  },
  isFallback: false,
  isLocaleDomain: false,
  isReady: true,
  isPreview: false,
};

export function customRender(
  ui: ReactElement<any, string | JSXElementConstructor<any>>,
  { locale = 'en' as Language, router = {}, ...renderOptions } = {},
) {
  const messages = locale === 'ja' ? ja : en;
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <RouterContext.Provider value={{ ...mockRouter, ...router }}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <ReduxToolProvider>
          <ThemeProvider defaultTheme='light' enableSystem={false}>
            {children}
          </ThemeProvider>
        </ReduxToolProvider>
      </NextIntlClientProvider>
    </RouterContext.Provider>
  );
  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// re-export everything
export * from '@testing-library/react';
export * from '@testing-library/user-event';

// Override render method
export { customRender as render };
