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
import type { CreateUserDatails } from '@workspace/types/api';
import { User, type UserDocument, type UserModel } from '../schemas';

export interface IUsersRepository {
  exists(filter: RootFilterQuery<UserDocument>): Promise<Types.ObjectId | null>;
  find(filter: RootFilterQuery<UserDocument>): Promise<UserDocument[]>;
  findOne(filter: RootFilterQuery<UserDocument>): Promise<UserDocument | null>;
  findAll(): Promise<UserDocument[]>;
  create(data: CreateUserDatails[]): Promise<UserDocument[]>;
  updateMany(
    filter: RootFilterQuery<UserDocument>,
    data: UpdateQuery<UserDocument>,
    options: UpdateOptions & MongooseUpdateQueryOptions<UserDocument>,
  ): Promise<UpdateWriteOpResult>;
  updateOne(
    filter: RootFilterQuery<UserDocument>,
    data: UpdateQuery<UserDocument>,
    options: UpdateOptions & MongooseUpdateQueryOptions<UserDocument>,
  ): Promise<UpdateWriteOpResult>;
  findOneAndUpdate(
    filter: RootFilterQuery<UserDocument>,
    data: UpdateQuery<UserDocument>,
    options: QueryOptions<UserDocument>,
  ): Promise<UserDocument | null>;
}

export class UsersRepository implements IUsersRepository {
  /**
   * Constructs a new UsersRepository instance.
   * @param userModel - The UserModel injected from Mongoose.
   */
  constructor(
    @InjectModel(User.name, 'main')
    private userModel: UserModel,
  ) {}

  /**
   * Checks if a user exists based on the given filter.
   * @param filter - The filter query to identify the user.
   * @returns The ObjectId of the user if exists, otherwise null.
   */
  async exists(filter: RootFilterQuery<UserDocument>): Promise<Types.ObjectId | null> {
    const result = await this.userModel.exists(filter).exec();
    return result ? result._id : null;
  }

  /**
   * Finds multiple users based on the given filter.
   * @param filter - The filter query to find users.
   * @returns A list of UserDocuments matching the filter.
   */
  find(filter: RootFilterQuery<UserDocument>): Promise<UserDocument[]> {
    return this.userModel.find(filter).exec();
  }

  /**
   * Finds a single user based on the given filter.
   * @param filter - The filter query to find a single user.
   * @returns A UserDocument if found, otherwise null.
   */
  findOne(filter: RootFilterQuery<UserDocument>): Promise<UserDocument | null> {
    return this.userModel.findOne(filter).exec();
  }

  /**
   * Retrieves all users from the database.
   * @returns A list of all UserDocuments.
   */
  findAll(): Promise<UserDocument[]> {
    return this.find({});
  }

  /**
   * Creates new users in the database.
   * @param data - The details of users to be created.
   * @param options - Additional creation options.
   * @returns A list of created UserDocuments.
   */
  create(data: CreateUserDatails[], options?: CreateOptions): Promise<UserDocument[]> {
    return this.userModel.create(data, options);
  }

  /**
   * Updates multiple users based on the given filter.
   * @param filter - The filter query to identify users to update.
   * @param data - The data used to update the users.
   * @param options - Additional update options.
   * @returns The result of the update operation.
   */
  updateMany(
    filter: RootFilterQuery<UserDocument>,
    data: UpdateQuery<UserDocument>,
    options?: UpdateOptions & MongooseUpdateQueryOptions<UserDocument>,
  ): Promise<UpdateWriteOpResult> {
    return this.userModel.updateMany(filter, data, options).exec();
  }

  /**
   * Updates a single user based on the given filter.
   * @param filter - The filter query to identify the user to update.
   * @param data - The data used to update the user.
   * @param options - Additional update options.
   * @returns The result of the update operation.
   */
  updateOne(
    filter: RootFilterQuery<UserDocument>,
    data: UpdateQuery<UserDocument>,
    options?: UpdateOptions & MongooseUpdateQueryOptions<UserDocument>,
  ): Promise<UpdateWriteOpResult> {
    return this.userModel.updateOne(filter, data, options).exec();
  }

  /**
   * Finds a single user based on the filter and updates it.
   * @param filter - The filter query to identify the user.
   * @param data - The data used to update the user.
   * @param options - Additional query options.
   * @returns The updated UserDocument if found, otherwise null.
   */
  findOneAndUpdate(
    filter: RootFilterQuery<UserDocument>,
    data: UpdateQuery<UserDocument>,
    options?: QueryOptions<UserDocument>,
  ): Promise<UserDocument | null> {
    return this.userModel.findOneAndUpdate(filter, data, options).exec();
  }
}
