import { ErrorCode } from '@workspace/constants';
import { type RESTErrorData } from '@workspace/types/api';
import { InternalServerErrorAPIException } from './http.exceptions';

export class MissingUserPasswordException extends InternalServerErrorAPIException {
  constructor(errors?: RESTErrorData) {
    super(ErrorCode.MissingUserPassword, `Password is not set for this account.`, errors);
  }
}
