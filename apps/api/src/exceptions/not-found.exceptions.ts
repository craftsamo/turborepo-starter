import { ErrorCode } from '@workspace/constants';
import { type RESTErrorData } from '@workspace/types/api';
import { NotFoundAPIException } from './http.exceptions';

export class UserNotFoundException extends NotFoundAPIException {
  constructor(uid: string, errors?: RESTErrorData) {
    super(ErrorCode.UnknownAccount, `User with ID ${uid} not found.`, errors);
  }
}
