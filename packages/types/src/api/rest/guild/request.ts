import type { CreateGuildDetails } from '../../models/guild';

/**
 * The payload format for creating a new guild via the API.
 */
export type RESTPostAPIGuildJSON = CreateGuildDetails;

/**
 * The payload format for partially updating a guild via the API.
 * All fields are optional.
 */
export type RESTPatchAPIGuildJSON = Partial<RESTPostAPIGuildJSON>;
