/* eslint no-undef: off */

import '@testing-library/jest-dom';
import React from 'react';
import { useLocale } from 'next-intl';
import { vi } from 'vitest';
import en from '@/i18n/messages/en.json';
import ja from '@/i18n/messages/ja.json';

const testMessages = { en, ja };

function getMessage(messages, key) {
  return key.split('.').reduce((value, segment) => value?.[segment], messages);
}

function translate(locale, namespace, key, values = {}) {
  const message = getMessage(testMessages[locale], `${namespace}.${key}`);

  if (typeof message !== 'string') return `${namespace}.${key}`;

  return message.replace(/\{(\w+)(?:,\s*number)?\}/g, (_, name) => {
    const value = values[name];
    return typeof value === 'number' ? new Intl.NumberFormat(locale).format(value) : String(value);
  });
}

vi.mock('next-intl/server', () => ({
  getLocale: vi.fn(async () => 'en'),
  getTranslations: vi.fn(async (options) => {
    const locale = typeof options === 'string' ? 'en' : (options.locale ?? 'en');
    const namespace = typeof options === 'string' ? options : options.namespace;

    return (key, values) => translate(locale, namespace, key, values);
  }),
  setRequestLocale: vi.fn(),
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, locale: requestedLocale, prefetch: _prefetch, ...props }) => {
    void _prefetch;
    const activeLocale = useLocale();
    const locale = requestedLocale ?? activeLocale;
    const localizedHref =
      typeof href === 'string' && href.startsWith('/')
        ? href === '/'
          ? `/${locale}`
          : `/${locale}${href}`
        : href;

    return React.createElement('a', { href: localizedHref, ...props });
  },
  getPathname: vi.fn(),
  redirect: vi.fn(),
  usePathname: () => '/',
  useRouter: () => ({ replace: vi.fn() }),
}));

globalThis.setImmediate = vi.useRealTimers;

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

window.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

vi.mock('next/router', () => ({
  useRouter: () => ({
    route: '/',
    pathname: '',
    query: '',
    asPath: '',
    push: vi.fn(),
    events: {
      on: vi.fn(),
      off: vi.fn(),
    },
    beforePopState: vi.fn(() => null),
    prefetch: vi.fn(() => null),
  }),
}));
