import type { APIBaseModel, OmitBaseModelFields } from '../../models/base';
import type { IRoleModel, IRoleDocumentFields } from '../../models/role';
import type { APIGuild } from '../guild';

/**
 * Represents a REST API Role object in the application.
 * - Removes fields defined in OmitBaseModelFields and IRoleDocumentFields from IRoleModel.
 * - Includes IBaseModel fields.
 * - Adds a `guild` property representing the associated APIGuild.
 */
export type APIRole = Omit<IRoleModel, OmitBaseModelFields | IRoleDocumentFields> &
  APIBaseModel & {
    guild: APIGuild;
  };
