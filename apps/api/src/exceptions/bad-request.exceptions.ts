import { ErrorCode } from '@workspace/constants';
import { type RESTErrorData } from '@workspace/types/api';
import { BadRequestAPIException } from './http.exceptions';

export class GlobalValidationException extends BadRequestAPIException {
  constructor(errors?: RESTErrorData) {
    super(ErrorCode.InvalidBody, 'Validation error.', errors);
  }
}

export class InvalidParameterException extends BadRequestAPIException {
  constructor(param: string, errors?: RESTErrorData) {
    super(ErrorCode.InvalidParameter, `Invalid ${param}.`, errors);
  }
}

export class InvalidLocalAuthCredentialsException extends BadRequestAPIException {
  constructor(property: 'email' | 'password', errors?: RESTErrorData) {
    const errorCode = property === 'email' ? ErrorCode.InvalidEmail : ErrorCode.InvalidPassword;
    super(errorCode, `Invalid value for email or password.`, errors);
  }
}
