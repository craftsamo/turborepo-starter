import { ErrorCode } from '@workspace/constants';
import { type RESTErrorData } from '@workspace/types/api';
import { ConflictAPIException } from './http.exceptions';

export class AlreadyUserExistsException extends ConflictAPIException {
  constructor(property: string, errors?: RESTErrorData) {
    super(ErrorCode.AlreadyAccount, `User with ${property} already exists.`, errors);
  }
}

export class AlreadyGuildExistsException extends ConflictAPIException {
  constructor(property: string, errors?: RESTErrorData) {
    super(ErrorCode.AlreadyGuild, `Guild with ${property} already exists.`, errors);
  }
}

export class AlreadyRoleExistsException extends ConflictAPIException {
  constructor(property: string, errors?: RESTErrorData) {
    super(ErrorCode.AlreadyRole, `Role with ${property} already exists.`, errors);
  }
}

export class AlreadyCommandExistsException extends ConflictAPIException {
  constructor(property: string, errors?: RESTErrorData) {
    super(ErrorCode.AlreadyCommand, `Command with ${property} already exists.`, errors);
  }
}
