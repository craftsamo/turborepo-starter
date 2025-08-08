import type { APIBaseModel, OmitBaseModelFields } from '../../models/base';
import type { IGuildModel } from '../../models/guild';

/**
 * Represents the API data shape for a guild.
 *
 * This type omits internal base model fields from IGuildModel and adds APIBaseModel fields,
 * ensuring only necessary and safe properties are exposed via the API.
 */
export type APIGuild = Omit<IGuildModel, OmitBaseModelFields> & APIBaseModel;
