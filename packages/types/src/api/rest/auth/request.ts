import type { RESTPostAPIUserJSON } from '../user';

/**
 * Interface representing the JSON structure for a local login request.
 */
export interface RESTPostAPIDiscordAuthLoginJSON {}

/**
 * Interface representing the JSON structure for a local registration request.
 * Extends the user JSON structure, omitting the 'uuid' field.
 */
export interface RESTPostAPIDiscordAuthRegisterJSON extends Omit<RESTPostAPIUserJSON, 'uid'> {}
