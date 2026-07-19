import type { Language } from '@workspace/constants';
import type messages from '@/i18n/messages/en.json';

declare module 'next-intl' {
  interface AppConfig {
    Locale: Language;
    Messages: typeof messages;
  }
}
