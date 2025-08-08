import type { ICommandModelDocumentFields, CreateCommandDetails } from '../../models/command';

/**
 * RESTPostAPICommandJSON represents the payload structure for posting a command via the REST API.
 * It omits base model fields and document fields from ICommandModel,
 * and expects a list of guild IDs as strings.
 */
export type RESTPostAPICommandJSON = Omit<CreateCommandDetails, ICommandModelDocumentFields> & {
  guilds: string[];
};

export type RESTPatchAPICommandJSON = Partial<RESTPostAPICommandJSON>;
