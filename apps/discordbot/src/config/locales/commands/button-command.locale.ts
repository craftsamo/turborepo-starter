import type { Locales, CommandLocale, LocaleKeyPathsWithoutTasks } from '@workspace/types/discord-bot';

export interface ButtonComandLocale extends CommandLocale {
  buttonLabel: string;
}

export const buttonCommandLocale: Locales<ButtonComandLocale> = {
  'en-US': {
    name: 'button_command',
    description: 'Sends a message containing a button',
    buttonLabel: 'Click',
    messages: {
      firstTime: 'Creating a message with a button...',
      success: 'Try pressing the button 😎',
      nodeError: 'A problem occurred',
      unknownError: 'An exception occurred',
      discordJsError: 'A problem discord',
      apiError: 'An error occurred while communicating with the API',
    },
  },
  ja: {
    name: 'ボタンコマンド',
    description: 'ボタンを含むメッセージを返します',
    buttonLabel: 'クリック',
    messages: {
      firstTime: 'ボタン付きメッセージを作成します...',
      success: 'ボタンを押してみてください 😎',
      nodeError: '問題が発生しました',
      unknownError: '例外が発生しました',
      discordJsError: 'Discordで問題が発生しました',
      apiError: 'APIとの通信でエラーが発生しました',
    },
  },
};

export type ButtonCommandLocaleKey = LocaleKeyPathsWithoutTasks<ButtonComandLocale, 'buttonLabel'>;
