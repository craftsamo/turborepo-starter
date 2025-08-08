import type { CreateRoleDetails, IRoleDocumentFields } from '../../models/role';

/**
 * The payload for creating a new role via the REST API.
 * This type omits fields defined in IRoleDocumentFields from CreateRoleDetails,
 * and requires an additional 'guild' property specifying the guild ID.
 */
export type RESTPostAPIRoleJSON = Omit<CreateRoleDetails, IRoleDocumentFields> & {
  guild: string;
};

/**
 * The payload for partially updating a role via the REST API.
 * All fields from RESTPostAPIRoleJSON are optional.
 */
export type RESTPatchAPIRoleJSON = Partial<RESTPostAPIRoleJSON>;
