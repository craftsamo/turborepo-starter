import type { NextRouter } from 'next/router';
import { RouterContext } from 'next/dist/shared/lib/router-context.shared-runtime';
import type { JSXElementConstructor, ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react';
import { vi } from 'vitest';
import { ReduxToolProvider, ThemeProvider } from '@/components/Providers';

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
  { router = {}, ...renderOptions } = {},
) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <RouterContext.Provider value={{ ...mockRouter, ...router }}>
      <ReduxToolProvider>
        <ThemeProvider defaultTheme='light' enableSystem={false}>
          {children}
        </ThemeProvider>
      </ReduxToolProvider>
    </RouterContext.Provider>
  );
  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// re-export everything
export * from '@testing-library/react';
export * from '@testing-library/user-event';

// Override render method
export { customRender as render };
