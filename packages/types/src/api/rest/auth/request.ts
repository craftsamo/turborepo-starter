import type { RESTPostAPIUserJSON } from '../user';

/**
 * Interface representing the JSON structure for a local login request.
 */
export interface RESTPostAPILocalAuthLoginJSON {
  /**
   * The email of the user.
   */
  email: string;

  /**
   * The password of the user.
   */
  password: string;
}

/**
 * Interface representing the JSON structure for a local registration request.
 * Extends the user JSON structure, omitting the 'uuid' field.
 */
export interface RESTPostAPILocalAuthRegisterJSON extends Omit<RESTPostAPIUserJSON, 'uid'> {
  /**
   * The email of the user.
   */
  email: string;

  /**
   * The password of the user.
   */
  password: string;
}
