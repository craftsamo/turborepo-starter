import type { APIBaseModel, OmitBaseModelFields } from '../../models/base';
import type { IUserModel } from '../../models';

/**
 * Fields to be omitted from the API user response.
 */
export type OmitAPIUserResponseFields = 'password';

/**
 * Type representing a user in the API, omitting certain fields.
 */
export type APIUser = Omit<IUserModel, OmitBaseModelFields | OmitAPIUserResponseFields> & APIBaseModel;
