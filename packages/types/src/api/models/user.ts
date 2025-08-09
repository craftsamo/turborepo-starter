import type { IBaseModel, OmitBaseModelFields } from './base';

/**
 * Interface representing a user model.
 */
export interface IUserModel extends IBaseModel {
  /**
   * The unique identifier for the user.
   */
  uid: string;

  /**
   * The Discord ID of the user.
   */
  discordId: string;

  /**
   * The display name of the user.
   */
  displayName: string;

  /**
   * The username of the user.
   */
  username: string;
}

/**
 * Type for creating user details, omitting base model fields.
 */
export type CreateUserDatails = Omit<IUserModel, OmitBaseModelFields>;

/**
 * Type representing a partial update to user details.
 */
export type UpdateUserDetails = Partial<CreateUserDatails>;
