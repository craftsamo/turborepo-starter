'use client';

import { useLocale } from 'next-intl';
import { useState } from 'react';
import type { Language } from '@workspace/constants';
import { getPathname, usePathname } from './navigation';
import { localeOptions } from './routing';

export function useLocaleSwitch() {
  const locale = useLocale();
  const pathname = usePathname();
  const [isPending, setIsPending] = useState(false);

  const switchLocale = (nextLocale: Language) => {
    if (nextLocale === locale || isPending) return;

    const localizedPathname = getPathname({ href: pathname, locale: nextLocale });
    const href = `${localizedPathname}${window.location.search}${window.location.hash}`;

    // The locale segment owns the document shell. Reloading prevents providers
    // that inject initialization scripts from remounting during client render.
    setIsPending(true);
    window.location.replace(href);
  };

  return {
    locale,
    options: localeOptions,
    isPending,
    switchLocale,
  };
}
