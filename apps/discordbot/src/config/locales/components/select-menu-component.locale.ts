import type { Locales, BaseLocale, BaseLocaleDotKey } from '@workspace/types/discord-bot';

export const selectMenuComponentLocale: Locales<BaseLocale> = {
  'en-US': {
    name: 'SelectMenuComponent',
    messages: {
      firstTime: 'Handling select menu interaction...',
      success: 'Selection received!',
      nodeError: 'A problem occurred',
      unknownError: 'An exception occurred',
      discordJsError: 'A problem discord',
    },
  },
  ja: {
    name: 'セレクトメニューコンポーネント',
    messages: {
      firstTime: 'セレクトメニューの操作を処理しています...',
      success: '選択を受け取りました！',
      nodeError: '問題が発生しました',
      unknownError: '例外が発生しました',
      discordJsError: 'Discordで問題が発生しました',
    },
  },
};

export type SelectMenuComponentLocaleKey = BaseLocaleDotKey;
