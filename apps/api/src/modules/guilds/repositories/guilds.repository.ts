import { InjectModel } from '@nestjs/mongoose';
import type { UpdateOptions } from 'mongodb';
import type {
  QueryOptions,
  CreateOptions,
  MongooseUpdateQueryOptions,
  RootFilterQuery,
  Types,
  UpdateQuery,
  UpdateWriteOpResult,
} from 'mongoose';
import type { CreateGuildDetails } from '@workspace/types/api';
import { Guild, type GuildDocument, type GuildModel } from '../schemas';

export interface IGuildsRepository {
  exists(filter: RootFilterQuery<GuildDocument>): Promise<Types.ObjectId | null>;
  find(filter: RootFilterQuery<GuildDocument>): Promise<GuildDocument[]>;
  findOne(filter: RootFilterQuery<GuildDocument>): Promise<GuildDocument | null>;
  findAll(): Promise<GuildDocument[]>;
  create(data: CreateGuildDetails[], options?: CreateOptions): Promise<GuildDocument[]>;
  updateMany(
    filter: RootFilterQuery<GuildDocument>,
    data: UpdateQuery<GuildDocument>,
    options?: UpdateOptions & MongooseUpdateQueryOptions<GuildDocument>,
  ): Promise<UpdateWriteOpResult>;
  updateOne(
    filter: RootFilterQuery<GuildDocument>,
    data: UpdateQuery<GuildDocument>,
    options?: UpdateOptions & MongooseUpdateQueryOptions<GuildDocument>,
  ): Promise<UpdateWriteOpResult>;
  findOneAndUpdate(
    filter: RootFilterQuery<GuildDocument>,
    data: UpdateQuery<GuildDocument>,
    options?: QueryOptions<GuildDocument>,
  ): Promise<GuildDocument | null>;
}

export class GuildsRepository implements IGuildsRepository {
  /**
   * Constructs a new GuildsRepository.
   * @param guildModel - The Mongoose model for the Guild schema.
   */
  constructor(
    @InjectModel(Guild.name, 'discord')
    private guildModel: GuildModel,
  ) {}

  /**
   * Checks if a guild document exists that matches the filter.
   * @param filter - The filter query to apply.
   * @returns The ObjectId of the matched document or null if not found.
   */
  async exists(filter: RootFilterQuery<GuildDocument>): Promise<Types.ObjectId | null> {
    const result = await this.guildModel.exists(filter).exec();
    return result ? result._id : null;
  }

  /**
   * Finds all guild documents that match the given filter.
   * @param filter - The filter query to apply.
   * @returns A promise resolving to an array of matching guild documents.
   */
  find(filter: RootFilterQuery<GuildDocument>): Promise<GuildDocument[]> {
    return this.guildModel.find(filter).exec();
  }

  /**
   * Finds a single guild document that matches the given filter.
   * @param filter - The filter query to apply.
   * @returns A promise resolving to the matching guild document or null.
   */
  findOne(filter: RootFilterQuery<GuildDocument>): Promise<GuildDocument | null> {
    return this.guildModel.findOne(filter).exec();
  }

  /**
   * Finds all guild documents in the collection.
   * @returns A promise resolving to an array of all guild documents.
   */
  findAll(): Promise<GuildDocument[]> {
    return this.find({});
  }

  /**
   * Creates new guild documents.
   * @param data - Array of guild details to create.
   * @param options - (Optional) Create options.
   * @returns A promise resolving to the created guild documents.
   */
  create(data: CreateGuildDetails[], options?: CreateOptions): Promise<GuildDocument[]> {
    return this.guildModel.create(data, options);
  }

  /**
   * Updates multiple guild documents matching the filter.
   * @param filter - The filter query to apply.
   * @param data - The update operations to apply.
   * @param options - (Optional) Update options.
   * @returns A promise resolving to the update operation result.
   */
  updateMany(
    filter: RootFilterQuery<GuildDocument>,
    data: UpdateQuery<GuildDocument>,
    options?: UpdateOptions & MongooseUpdateQueryOptions<GuildDocument>,
  ): Promise<UpdateWriteOpResult> {
    return this.guildModel.updateMany(filter, data, options).exec();
  }

  /**
   * Updates a single guild document matching the filter.
   * @param filter - The filter query to apply.
   * @param data - The update operations to apply.
   * @param options - (Optional) Update options.
   * @returns A promise resolving to the update operation result.
   */
  updateOne(
    filter: RootFilterQuery<GuildDocument>,
    data: UpdateQuery<GuildDocument>,
    options?: UpdateOptions & MongooseUpdateQueryOptions<GuildDocument>,
  ): Promise<UpdateWriteOpResult> {
    return this.guildModel.updateOne(filter, data, options).exec();
  }

  /**
   * Finds a single guild document and updates it.
   * @param filter - The filter query to apply.
   * @param data - The update operations to apply.
   * @param options - (Optional) Query options.
   * @returns A promise resolving to the updated guild document or null.
   */
  findOneAndUpdate(
    filter: RootFilterQuery<GuildDocument>,
    data: UpdateQuery<GuildDocument>,
    options?: QueryOptions<GuildDocument>,
  ): Promise<GuildDocument | null> {
    return this.guildModel.findOneAndUpdate(filter, data, options).exec();
  }
}
