import type { IBaseModel, OmitBaseModelFields } from './base';

/**
 * The IGuildModel interface represents a guild entity with its base model fields.
 */
export interface IGuildModel extends IBaseModel {
  /**
   * Unique identifier for the guild.
   */
  uid: string;

  /**
   * Name of the guild.
   */
  name: string;

  /**
   * Optional icon URL or data for the guild.
   */
  icon?: string;
}

/**
 * Type for parameters required to create a new guild, omitting base model fields.
 */
export type CreateGuildDetails = Omit<IGuildModel, OmitBaseModelFields>;

/**
 * Type for parameters allowed to update a guild; all fields are optional.
 */
export type UpdateGuildDetails = Partial<CreateGuildDetails>;
