import type { Locales, BaseLocale, BaseLocaleDotKey } from '@workspace/types/discord-bot';

export const buttonComponentLocale: Locales<BaseLocale> = {
  'en-US': {
    name: 'ButtonComponent',
    messages: {
      firstTime: '',
      success: 'Button clicked!',
      nodeError: 'A problem occurred',
      unknownError: 'An exception occurred',
      discordJsError: 'A problem discord',
    },
  },
  ja: {
    name: 'ボタンコンポーネント',
    messages: {
      firstTime: '',
      success: 'ボタンをクリックしました！',
      nodeError: '問題が発生しました',
      unknownError: '例外が発生しました',
      discordJsError: 'Discordで問題が発生しました',
    },
  },
};

export type ButtonComponentLocaleKey = BaseLocaleDotKey;
