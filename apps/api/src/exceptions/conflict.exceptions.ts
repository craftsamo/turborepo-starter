import { ErrorCode } from '@workspace/constants';
import { type RESTErrorData } from '@workspace/types/api';
import { ConflictAPIException } from './http.exceptions';

export class AlreadyUserExistsException extends ConflictAPIException {
  constructor(property: string, errors?: RESTErrorData) {
    super(ErrorCode.AlreadyAccount, `User with ${property} already exists.`, errors);
  }
}
