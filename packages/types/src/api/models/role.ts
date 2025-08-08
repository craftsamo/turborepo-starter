import type { ObjectId } from 'mongoose';
import type { IBaseModel, OmitBaseModelFields } from './base';
import type { IGuildModel } from './guild';

export interface IRoleModel extends IBaseModel {
  /**
   * Unique identifier for the role
   */
  uid: string;

  /**
   * Name of the role
   */
  name: string;

  /**
   * Optional icon for the role
   */
  icon?: string;

  /**
   * Optional description for the role
   */
  description?: string;

  /**
   * The guild this role belongs to
   */
  guild: IGuildModel;
}

/**
 * Document fields for the Role model that reference other documents.
 */
export type IRoleDocumentFields = 'guild';

/**
 * Details required to create a new role (excluding base model fields).
 */
export type CreateRoleDetails = Omit<IRoleModel, OmitBaseModelFields | IRoleDocumentFields> & {
  guild: ObjectId;
};

/**
 * Details for updating a role; all fields are optional.
 */
export type UpdateRoleDetails = Partial<CreateRoleDetails>;
