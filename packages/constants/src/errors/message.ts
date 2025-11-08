import { ErrorCode } from './code';

export interface ErrorMessage {
  log: string;
  notice: string;
}

const General = {
  log: 'This is a general HTTP error. Please review the implementation of the HTTP request.',
  notice: 'A problem has occurred.',
} as const;

const InvalidBody = {
  log: 'The request body is invalid. Please review the implementation of the body.',
  notice: 'A problem has occurred.',
} as const;

const InvalidParameter = {
  log: 'The request parameter is invalid. Please review the implementation of the parameter.',
  notice: 'An invalid parameter has been set.',
} as const;

const MaximumRetryAttemptsExceeded = {
  log: 'The maximum number of retry attempts has been exceeded. Please review the implementation.',
  notice:
    'The maximum number of operation attempts has been exceeded. Please try again after some time.',
} as const;

export const ErrorMessage: Record<ErrorCode, ErrorMessage> = {
  [ErrorCode.General]: General,
  [ErrorCode.InvalidBody]: InvalidBody,
  [ErrorCode.InvalidParameter]: InvalidParameter,
  [ErrorCode.MaximumRetryAttemptsExceeded]: MaximumRetryAttemptsExceeded,
} as const;

const NodeError = {
  log: 'A Node.js error has occurred. Please check the implementation.',
  notice: 'A problem has occurred.',
};

const UnknownError = {
  log: 'An unknown error has occurred. Please check the implementation.',
  notice: 'An unexpected problem has occurred.',
};

export const NodeErrorMessage: Record<'NodeError' | 'UnknownError', ErrorMessage> = {
  NodeError: NodeError,
  UnknownError: UnknownError,
};
