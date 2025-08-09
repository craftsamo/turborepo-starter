import type { CreateUserDatails, UpdateUserDetails } from '../../models/user';

/**
 * Type representing the JSON structure for a POST request to create a user.
 */
export type RESTPostAPIUserJSON = Omit<CreateUserDatails, 'uid'> & {};

/**
 * Type representing a partial update to a user.
 * This type is used for PATCH requests to update user information.
 */
export type RESTPatchAPIUserJSON = UpdateUserDetails;
