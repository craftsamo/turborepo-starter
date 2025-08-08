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
import type { CreateRoleDetails } from '@workspace/types/api';
import { Role, type RoleDocument, type RoleModel } from '../schemas';

export interface IRolesRepository {
  exists(filter: RootFilterQuery<RoleDocument>): Promise<Types.ObjectId | null>;
  find(filter: RootFilterQuery<RoleDocument>): Promise<RoleDocument[]>;
  findAll(): Promise<RoleDocument[]>;
  findOne(filter: RootFilterQuery<RoleDocument>): Promise<RoleDocument | null>;
  create(data: CreateRoleDetails[], options?: CreateOptions): Promise<RoleDocument[]>;
  updateMany(
    filter: RootFilterQuery<RoleDocument>,
    data: UpdateQuery<RoleDocument>,
    options?: UpdateOptions & MongooseUpdateQueryOptions<RoleDocument>,
  ): Promise<UpdateWriteOpResult>;
  updateOne(
    filter: RootFilterQuery<RoleDocument>,
    data: UpdateQuery<RoleDocument>,
    options?: UpdateOptions & MongooseUpdateQueryOptions<RoleDocument>,
  ): Promise<UpdateWriteOpResult>;
  findOneAndUpdate(
    filter: RootFilterQuery<RoleDocument>,
    data: UpdateQuery<RoleDocument>,
    options?: QueryOptions<RoleDocument>,
  ): Promise<RoleDocument | null>;
}

/**
 * Repository class for managing Role documents in the MongoDB database using Mongoose.
 * Provides methods for CRUD operations on roles.
 */
export class RolesRepository implements IRolesRepository {
  /**
   * Creates an instance of RolesRepository.
   * @param roleModel The injected Mongoose model for Role.
   */
  constructor(
    @InjectModel(Role.name, 'discord')
    private roleModel: RoleModel,
  ) {}

  /**
   * Checks if a document exists that matches the given filter.
   * @param filter The filter query to match documents.
   * @returns The ObjectId of the existing document, or null if not found.
   */
  async exists(filter: RootFilterQuery<RoleDocument>): Promise<Types.ObjectId | null> {
    const result = await this.roleModel.exists(filter).exec();
    return result ? result._id : null;
  }

  /**
   * Finds documents that match the given filter.
   * @param filter The filter query to match documents.
   * @returns An array of matching Role documents.
   */
  find(filter: RootFilterQuery<RoleDocument>): Promise<RoleDocument[]> {
    return this.roleModel.find(filter).exec();
  }

  /**
   * Finds a single document that matches the given filter.
   * @param filter The filter query to match the document.
   * @returns The matching Role document, or null if not found.
   */
  findOne(filter: RootFilterQuery<RoleDocument>): Promise<RoleDocument | null> {
    return this.roleModel.findOne(filter).exec();
  }

  /**
   * Retrieves all Role documents from the collection.
   * @returns An array of all Role documents.
   */
  findAll(): Promise<RoleDocument[]> {
    return this.find({});
  }

  /**
   * Creates new Role documents in the collection.
   * @param data Array of Role details to create.
   * @param options Optional Mongoose create options.
   * @returns An array of created Role documents.
   */
  create(data: CreateRoleDetails[], options?: CreateOptions): Promise<RoleDocument[]> {
    return this.roleModel.create(data, options);
  }

  /**
   * Updates multiple documents that match the given filter.
   * @param filter The filter query to match documents.
   * @param data The update operations to apply.
   * @param options Optional update options.
   * @returns The result of the update operation.
   */
  updateMany(
    filter: RootFilterQuery<RoleDocument>,
    data: UpdateQuery<RoleDocument>,
    options?: UpdateOptions & MongooseUpdateQueryOptions<RoleDocument>,
  ): Promise<UpdateWriteOpResult> {
    return this.roleModel.updateMany(filter, data, options).exec();
  }

  /**
   * Updates a single document that matches the given filter.
   * @param filter The filter query to match the document.
   * @param data The update operations to apply.
   * @param options Optional update options.
   * @returns The result of the update operation.
   */
  updateOne(
    filter: RootFilterQuery<RoleDocument>,
    data: UpdateQuery<RoleDocument>,
    options?: UpdateOptions & MongooseUpdateQueryOptions<RoleDocument>,
  ): Promise<UpdateWriteOpResult> {
    return this.roleModel.updateOne(filter, data, options).exec();
  }

  /**
   * Finds a document and updates it in a single atomic operation.
   * @param filter The filter query to match the document.
   * @param data The update operations to apply.
   * @param options Optional query options.
   * @returns The updated Role document, or null if not found.
   */
  findOneAndUpdate(
    filter: RootFilterQuery<RoleDocument>,
    data: UpdateQuery<RoleDocument>,
    options?: QueryOptions<RoleDocument>,
  ): Promise<RoleDocument | null> {
    return this.roleModel.findOneAndUpdate(filter, data, options).exec();
  }
}
