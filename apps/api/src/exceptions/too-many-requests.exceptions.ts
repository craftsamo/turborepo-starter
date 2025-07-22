import { type RESTErrorData } from '@workspace/types/api';
import { ErrorCode } from '@workspace/constants';
import { TooManyRequestsAPIException } from './http.exceptions';

export class MaximumRetryAttemptsExceededException extends TooManyRequestsAPIException {
  constructor(url: string, retryCount: number, errors?: RESTErrorData) {
    super(
      ErrorCode.MaximumRetryAttemptsExceeded,
      `Maximum retry attempts exceeded for ${url} after ${retryCount} retries.`,
      errors,
    );
  }
}
