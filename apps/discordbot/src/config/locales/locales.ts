import * as CommandLocales from './commands';
import * as ComponentLocales from './components';

type AnyLocales = Record<string, any>;
type LocalRegistry = Record<string, any>;

const normalizeKey = (exportName: string) => {
  return exportName
    .replace(/(Command|Component)?Locale$/i, '')
    .replace(/(Command|Component)$/i, '')
    .replace(/^([A-Z])/, (m) => m.toLowerCase());
};

const mergeLocales = (out: LocalRegistry, sources: Record<string, AnyLocales>, topKey: string, namespace?: string) => {
  for (const [exportName, locales] of Object.entries(sources)) {
    if (typeof locales !== 'object' || locales === null) continue;
    const short = normalizeKey(exportName);
    for (const [locale, value] of Object.entries(locales as AnyLocales)) {
      if (!out[locale]) out[locale] = {};
      if (!out[locale][topKey]) out[locale][topKey] = {};
      let place = out[locale][topKey];
      if (namespace) {
        if (!place[namespace]) place[namespace] = {};
        place = place[namespace];
      }
      place[short] = value;
    }
  }
};

const locales: LocalRegistry = {};

mergeLocales(locales, CommandLocales, 'commands', 'component');
mergeLocales(locales, ComponentLocales, 'component');

export { locales };
