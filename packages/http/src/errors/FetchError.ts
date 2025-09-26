import type { ErrorMessage } from '@workspace/constants';

export type FetchErrorCode = 'MISSING_URL' | 'URL_NOT_STRING' | 'INVALID_URL' | 'FETCH_ERROR';

const MISSING_URL = {
  log: 'The environment variable `url` is not set. Please check the implementation.',
  notice: 'A problem has occurred.',
} as const;

const URL_NOT_STRING = {
  log: 'The environment variable `url` is not a string. Please check the implementation.',
  notice: 'A problem has occurred.',
} as const;

const INVALID_URL = {
  log: 'The environment variable `url` is invalid as a URL. Please check the implementation.',
  notice: 'A problem has occurred.',
} as const;

const FETCH_ERROR = {
  log: 'An exception occurred during the HTTP request. Please check the implementation.',
  notice: 'A problem has occurred.',
} as const;

export const FETCH_ERROR_MESSAGES: Record<FetchErrorCode, ErrorMessage> = {
  MISSING_URL,
  URL_NOT_STRING,
  INVALID_URL,
  FETCH_ERROR,
} as const;

export type FetchErrorDetails = {
  baseUrl: string;
  fullPath?: string;
  origin?: string;
};

/**
 * Represents a custom error specifically for Fetcher operations.
 * This error includes a code and optional additional details to provide context
 * for the fetch operation failure.
 */
export class FetcherError extends Error {
  /**
   * The error code that categorizes the type of fetch error.
   */
  public readonly code: FetchErrorCode;

  /**
   * Optional additional details that provide context about the fetch error.
   */
  public readonly details?: FetchErrorDetails;

  /**
   * Constructs a new instance of FetcherError.
   *
   * @param code - The specific error code representing the fetch error.
   * @param messageOrDetails - Optional error message or additional details about the error.
   * @param details - Optional additional details about the error when `messageOrDetails` is a string.
   * @example
   * ```typescript
   *
   * // Default message (FETCH_ERROR_MESSAGES['MISSING_URL'].notice)
   * throw new FetcherError('MISSING_URL');
   *
   * // Custom message
   * throw new FetcherError('MISSING_URL', 'Error!!');
   * OR
   * throw new FetcherError('MISSING_URL', FETCH_ERROR_MESSAGES['MISSING_URL'].log);
   * ```
   */
  constructor(code: FetchErrorCode, messageOrDetails?: string | FetchErrorDetails, details?: FetchErrorDetails) {
    const message = typeof messageOrDetails === 'string' ? messageOrDetails : FETCH_ERROR_MESSAGES[code].notice;
    super(message);
    this.name = 'FetcherError';
    this.code = code;
    this.details = typeof messageOrDetails === 'object' ? messageOrDetails : details;
  }
}
