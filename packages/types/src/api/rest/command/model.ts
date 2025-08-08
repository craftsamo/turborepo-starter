import type { APIBaseModel, OmitBaseModelFields } from '../../models/base';
import type { ICommandModel, ICommandModelDocumentFields } from '../../models/command';
import type { APIGuild } from '../guild';

/**
 * APICommand represents a command entity returned from the API.
 * It omits base model fields and document fields from ICommandModel,
 * includes base model fields, and associates the command with a list of APIGuild objects.
 */
export type APICommand = Omit<ICommandModel, OmitBaseModelFields | ICommandModelDocumentFields> &
  APIBaseModel & {
    guilds: APIGuild[];
  };
