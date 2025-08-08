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
  notice: 'The maximum number of operation attempts has been exceeded. Please try again after some time.',
} as const;

const UnknownAccount = {
  log: 'An account specified in the `UserDocument` does not exist.',
  notice: 'The specified account could not be found.',
} as const;

const UnknownGuild = {
  log: 'A DiscordServer that does not exist in the `GuildDocument` was specified.',
  notice: 'The specified Discord server could not be found.',
} as const;

const UnknownRole = {
  log: 'A role that does not exist in the `RoleDocument` was specified.',
  notice: 'The specified role could not be found.',
} as const;

const AlreadyAccount = {
  log: 'The specified account already exists in the `UserDocument`, so the creation failed.',
  notice: 'The specified account already exists.',
} as const;

const AlreadyGuild = {
  log: 'The specified DiscordServer already exists in the `GuildDocument`, so the creation failed.',
  notice: 'The specified Discord server already exists.',
} as const;

const AlreadyRole = {
  log: 'The specified Role already exists in the `RoleDocument`, so the creation failed.',
  notice: 'The specified role already exists.',
} as const;

const AlreadyCommand = {
  log: 'The specified Command already exists in the `CommandDocument`, so the creation failed.',
  notice: 'The specified command already exists.',
} as const;

const InvalidEmail = {
  log: 'The specified email address is invalid.',
  notice: 'The specified email address is invalid.',
} as const;

const InvalidPassword = {
  log: 'The specified password is invalid.',
  notice: 'The specified password is invalid.',
} as const;

const MissingUserPassword = {
  log: 'The `password` was not set in the specified `User` document. Please review the implementation.',
  notice: 'A problem has occurred.',
} as const;

export const ErrorMessage: Record<ErrorCode, ErrorMessage> = {
  [ErrorCode.General]: General,
  [ErrorCode.InvalidBody]: InvalidBody,
  [ErrorCode.InvalidParameter]: InvalidParameter,
  [ErrorCode.MaximumRetryAttemptsExceeded]: MaximumRetryAttemptsExceeded,
  [ErrorCode.UnknownAccount]: UnknownAccount,
  [ErrorCode.UnknownGuild]: UnknownGuild,
  [ErrorCode.UnknownRole]: UnknownRole,
  [ErrorCode.AlreadyAccount]: AlreadyAccount,
  [ErrorCode.AlreadyGuild]: AlreadyGuild,
  [ErrorCode.AlreadyRole]: AlreadyRole,
  [ErrorCode.AlreadyCommand]: AlreadyCommand,
  [ErrorCode.InvalidEmail]: InvalidEmail,
  [ErrorCode.InvalidPassword]: InvalidPassword,
  [ErrorCode.MissingUserPassword]: MissingUserPassword,
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
