import { InjectModel } from '@nestjs/mongoose';
import type {
  MongooseUpdateQueryOptions,
  RootFilterQuery,
  UpdateWriteOpResult,
  Types,
  CreateOptions,
  UpdateQuery,
  QueryOptions,
} from 'mongoose';
import type { UpdateOptions } from 'mongodb';
import type { CreateCommandDetails } from '@workspace/types/api';
import { Command, type CommandDocument, type CommandModel } from '../schemas';

export interface ICommandsRepository {
  exists(filter: RootFilterQuery<CommandDocument>): Promise<Types.ObjectId | null>;
  find(filter: RootFilterQuery<CommandDocument>): Promise<CommandDocument[]>;
  findAll(): Promise<CommandDocument[]>;
  findOne(filter: RootFilterQuery<CommandDocument>): Promise<CommandDocument | null>;
  create(data: CreateCommandDetails[], options?: CreateOptions): Promise<CommandDocument[]>;
  updateMany(
    filter: RootFilterQuery<CommandDocument>,
    data: UpdateQuery<CommandDocument>,
    options?: UpdateOptions & MongooseUpdateQueryOptions<CommandDocument>,
  ): Promise<UpdateWriteOpResult>;
  updateOne(
    filter: RootFilterQuery<CommandDocument>,
    data: UpdateQuery<CommandDocument>,
    options?: UpdateOptions & MongooseUpdateQueryOptions<CommandDocument>,
  ): Promise<UpdateWriteOpResult>;
  findOneAndUpdate(
    filter: RootFilterQuery<CommandDocument>,
    data: UpdateQuery<CommandDocument>,
    options?: QueryOptions<CommandDocument>,
  ): Promise<CommandDocument | null>;
}

/**
 * Repository implementation for managing Command documents in the database.
 * Provides methods for common CRUD operations using Mongoose models.
 */
export class CommandsRepository implements ICommandsRepository {
  constructor(
    @InjectModel(Command.name, 'discord')
    private commandModel: CommandModel,
  ) {}

  /**
   * Checks if a document matching the filter exists.
   * @param filter - The filter criteria for the document.
   * @returns The ObjectId if found, otherwise null.
   */
  async exists(filter: RootFilterQuery<CommandDocument>): Promise<Types.ObjectId | null> {
    const result = await this.commandModel.exists(filter).exec();
    return result ? result._id : null;
  }

  /**
   * Finds documents matching the filter.
   * @param filter - The filter criteria for the documents.
   * @returns An array of CommandDocument objects.
   */
  find(filter: RootFilterQuery<CommandDocument>): Promise<CommandDocument[]> {
    return this.commandModel.find(filter).exec();
  }

  /**
   * Finds a single document matching the filter.
   * @param filter - The filter criteria for the document.
   * @returns The CommandDocument if found, otherwise null.
   */
  findOne(filter: RootFilterQuery<CommandDocument>): Promise<CommandDocument | null> {
    return this.commandModel.findOne(filter).exec();
  }

  /**
   * Retrieves all Command documents.
   * @returns An array of all CommandDocument objects.
   */
  findAll(): Promise<CommandDocument[]> {
    return this.find({});
  }

  /**
   * Creates one or more Command documents.
   * @param data - The data for the new Command documents.
   * @param options - Optional creation options.
   * @returns An array of created CommandDocument objects.
   */
  create(data: CreateCommandDetails[], options?: CreateOptions): Promise<CommandDocument[]> {
    return this.commandModel.create(data, options);
  }

  /**
   * Updates multiple documents matching the filter.
   * @param filter - The filter criteria for the documents.
   * @param data - The update data.
   * @param options - Optional update options.
   * @returns The result of the update operation.
   */
  updateMany(
    filter: RootFilterQuery<CommandDocument>,
    data: UpdateQuery<CommandDocument>,
    options?: UpdateOptions & MongooseUpdateQueryOptions<CommandDocument>,
  ): Promise<UpdateWriteOpResult> {
    return this.commandModel.updateMany(filter, data, options).exec();
  }

  /**
   * Updates a single document matching the filter.
   * @param filter - The filter criteria for the document.
   * @param data - The update data.
   * @param options - Optional update options.
   * @returns The result of the update operation.
   */
  updateOne(
    filter: RootFilterQuery<CommandDocument>,
    data: UpdateQuery<CommandDocument>,
    options?: UpdateOptions & MongooseUpdateQueryOptions<CommandDocument>,
  ): Promise<UpdateWriteOpResult> {
    return this.commandModel.updateOne(filter, data, options).exec();
  }

  /**
   * Finds a single document and updates it.
   * @param filter - The filter criteria for the document.
   * @param data - The update data.
   * @param options - Optional query options.
   * @returns The updated CommandDocument if found, otherwise null.
   */
  findOneAndUpdate(
    filter: RootFilterQuery<CommandDocument>,
    data: UpdateQuery<CommandDocument>,
    options?: QueryOptions<CommandDocument>,
  ): Promise<CommandDocument | null> {
    return this.commandModel.findOneAndUpdate(filter, data, options).exec();
  }
}
