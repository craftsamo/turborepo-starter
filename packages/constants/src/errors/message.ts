import { ErrorCode } from './code';
import type { Message } from '../language';

export interface ErrorMessage {
  log: Message;
  notice: Message;
}

const General = {
  log: {
    en: 'This is a general HTTP error. Please review the implementation of the HTTP request.',
    ja: '一般的な HTTP エラーが発生しました。HTTP リクエストの実装を確認してください。',
  },
  notice: {
    en: 'A problem has occurred.',
    ja: '問題が発生しました。',
  },
} as const satisfies ErrorMessage;

const InvalidBody = {
  log: {
    en: 'The request body is invalid. Please review the implementation of the body.',
    ja: 'リクエストボディが不正です。ボディの実装を確認してください。',
  },
  notice: {
    en: 'A problem has occurred.',
    ja: '問題が発生しました。',
  },
} as const satisfies ErrorMessage;

const InvalidParameter = {
  log: {
    en: 'The request parameter is invalid. Please review the implementation of the parameter.',
    ja: 'リクエストパラメーターが不正です。パラメーターの実装を確認してください。',
  },
  notice: {
    en: 'An invalid parameter has been set.',
    ja: '無効なパラメーターが指定されました。',
  },
} as const satisfies ErrorMessage;

const MaximumRetryAttemptsExceeded = {
  log: {
    en: 'The maximum number of retry attempts has been exceeded. Please review the implementation.',
    ja: '再試行回数の上限を超えました。実装を確認してください。',
  },
  notice: {
    en: 'The maximum number of operation attempts has been exceeded. Please try again after some time.',
    ja: '操作の試行回数が上限を超えました。しばらくしてからもう一度お試しください。',
  },
} as const satisfies ErrorMessage;

export const ErrorMessage: Record<ErrorCode, ErrorMessage> = {
  [ErrorCode.General]: General,
  [ErrorCode.InvalidBody]: InvalidBody,
  [ErrorCode.InvalidParameter]: InvalidParameter,
  [ErrorCode.MaximumRetryAttemptsExceeded]: MaximumRetryAttemptsExceeded,
} as const;

const NodeError = {
  log: {
    en: 'A Node.js error has occurred. Please check the implementation.',
    ja: 'Node.js エラーが発生しました。実装を確認してください。',
  },
  notice: {
    en: 'A problem has occurred.',
    ja: '問題が発生しました。',
  },
} as const satisfies ErrorMessage;

const UnknownError = {
  log: {
    en: 'An unknown error has occurred. Please check the implementation.',
    ja: '不明なエラーが発生しました。実装を確認してください。',
  },
  notice: {
    en: 'An unexpected problem has occurred.',
    ja: '予期しない問題が発生しました。',
  },
} as const satisfies ErrorMessage;

export const NodeErrorMessage: Record<'NodeError' | 'UnknownError', ErrorMessage> = {
  NodeError: NodeError,
  UnknownError: UnknownError,
};
