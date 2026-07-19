import { defineRouting } from 'next-intl/routing';
import { languages, type Language } from '@workspace/constants';

export const LOCALE_COOKIE_NAME = 'NEXT_LOCALE';
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLanguage(locale: string | undefined): locale is Language {
  return typeof locale === 'string' && (languages as readonly string[]).includes(locale);
}

export const localeOptions = [
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
] as const satisfies ReadonlyArray<{
  code: Language;
  label: string;
}>;

export const routing = defineRouting({
  locales: languages,
  defaultLocale: 'en',
  localePrefix: 'always',
  localeCookie: {
    name: LOCALE_COOKIE_NAME,
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: 'lax',
  },
});
