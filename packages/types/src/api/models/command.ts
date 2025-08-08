import type { ObjectId } from 'mongoose';
import type { IBaseModel, OmitBaseModelFields } from './base';
import type { IGuildModel } from './guild';

export interface ICommandModel extends IBaseModel {
  /**
   * Unique identifier for the guild.
   */
  uid: string;

  /**
   * Name of the guild.
   */
  name: string;

  /**
   * description of the command.
   */
  description?: string;

  /**
   * List of guilds that the command is available in.
   */
  guilds: IGuildModel[];

  /**
   * Whether the command is active or not.
   */
  disabled: boolean;
}

/**
 * The property keys of ICommandModel that are populated with Mongoose document references.
 */
export type ICommandModelDocumentFields = 'guilds';

/**
 * The information required to create a new command.
 * - Omits base model fields and fields that are replaced with references.
 * - The `guilds` field is an array of ObjectId references.
 */
export type CreateCommandDetails = Omit<ICommandModel, OmitBaseModelFields | ICommandModelDocumentFields> & {
  guilds: ObjectId[];
};

/**
 * The information allowed to update an existing command.
 * - All fields from CreateCommandDetails are optional.
 */
export type UpdateCommandDetails = Partial<CreateCommandDetails>;
