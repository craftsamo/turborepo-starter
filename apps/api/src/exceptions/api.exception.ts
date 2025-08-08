import { HttpException, HttpStatus } from '@nestjs/common';
import type { DiscordErrorData } from 'discord.js';
import { ErrorCode } from '@workspace/constants';
import { type RESTErrorData } from '@workspace/types/api';

export type APIExceptionDetails = {
  code: ErrorCode;
  message: string;
  errors?: RESTErrorData;
};

/**
 * Custom exception class for API errors.
 */
export class APIException extends HttpException {
  /**
   * Creates an instance of APIException.
   * @param code - The error code representing the specific error.
   * @param message - A descriptive error message.
   * @param status - The HTTP status code.
   * @param errors - Optional additional error data.
   */
  constructor(code: ErrorCode, message: string, status: HttpStatus, errors?: RESTErrorData) {
    super({ code, message, errors }, status);
  }
}

export class DiscordAPIErrorException extends APIException {
  /**
   * Exception class for Discord API errors.
   *
   * This class handles errors returned by Discord's API,
   * supporting multiple error formats including group wrappers, field errors,
   * and generic error objects.
   *
   * @param code - The error code returned by Discord API.
   * @param message - The error message returned by Discord API.
   * @param status - The HTTP status code to use for the exception.
   * @param errors - Optional. Discord API error detail, can be group, field error, or error object.
   *
   * @example
   * ```ts
   * import { type DiscordErrorData } from 'discord.js';
   *
   * const response = await fetch(url);
   *
   * if (!response.ok) {
   *   const { code, message, errors } = (await response.json()) as DiscordErrorData;
   *   throw new DiscordAPIErrorException(code, message, errors);
   * }
   * ```
   *
   */
  constructor(code: number, message: string, status: number, errors?: DiscordErrorData['errors']) {
    if (!errors) {
      // If there is no detailed error information
      super(code, message, status, undefined);
    }

    // For DiscordErrorGroupWrapper type
    else if (Array.isArray(errors)) {
      super(code, message, status, {
        _errors: errors.map((error) => ({
          code: String(error.code),
          message: error.message,
        })),
      });
    }

    // DiscordErrorFieldInformation or [k: string]: DiscordError or string type case
    else {
      super(code, message, status, errors as RESTErrorData);
    }
  }
}
