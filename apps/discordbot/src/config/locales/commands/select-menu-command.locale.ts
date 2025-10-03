import type { Locales, CommandLocale, LocaleKeyPathsWithoutTasks } from '@workspace/types/discord-bot';

export interface SelectMenuComandLocale extends CommandLocale {
  placeholder: string;
}

export const selectMenuCommandLocale: Locales<SelectMenuComandLocale> = {
  'en-US': {
    name: 'select_menu',
    description: 'Sends a message containing a select menu',
    placeholder: 'Choose a color',
    messages: {
      firstTime: 'Creating a message with a select menu...',
      success: 'Try selecting an option 😎',
      nodeError: 'A problem occurred',
      unknownError: 'An exception occurred',
      discordJsError: 'A problem discord',
      apiError: 'An error occurred while communicating with the API',
    },
  },
  ja: {
    name: 'セレクトメニュー',
    description: 'セレクトメニューを含むメッセージを返します',
    placeholder: '好きな色を選択してください',
    messages: {
      firstTime: 'セレクトメニュー付きメッセージを作成します...',
      success: '選択してみてください 😎',
      nodeError: '問題が発生しました',
      unknownError: '例外が発生しました',
      discordJsError: 'Discordで問題が発生しました',
      apiError: 'APIとの通信でエラーが発生しました',
    },
  },
};

export type SelectMenuCommandLocaleKey = LocaleKeyPathsWithoutTasks<SelectMenuComandLocale, 'placeholder'>;
