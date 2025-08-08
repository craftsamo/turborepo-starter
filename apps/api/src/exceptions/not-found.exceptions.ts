import { ErrorCode } from '@workspace/constants';
import { type RESTErrorData } from '@workspace/types/api';
import { NotFoundAPIException } from './http.exceptions';

export class UserNotFoundException extends NotFoundAPIException {
  constructor(uid: string, errors?: RESTErrorData) {
    super(ErrorCode.UnknownAccount, `User with ID ${uid} not found.`, errors);
  }
}

export class GuildNotFoundException extends NotFoundAPIException {
  constructor(guildId: string, errors?: RESTErrorData) {
    super(ErrorCode.UnknownGuild, `Guild with ID ${guildId} not found.`, errors);
  }
}

export class RoleNotFoundException extends NotFoundAPIException {
  constructor(roleId: string, errors?: RESTErrorData) {
    super(ErrorCode.UnknownRole, `Role with ID ${roleId} not found.`, errors);
  }
}
