import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { type APIUser } from '@workspace/types/api';
import { type UserDocument } from '../schemas';
import { UsersRepository } from '../repositories';

@Injectable()
export class UsersService {
  /**
   * Constructor for UsersService.
   * @param usersRepository - The repository responsible for user-related operations.
   */
  constructor(private usersRepository: UsersRepository) {}

  /**
   * Converts a UserDocument to an APIUser object.
   * @param user - The user document to be converted.
   * @returns The APIUser object.
   */
  toAPIUser(user: UserDocument): APIUser {
    return {
      _id: user._id.toString(),
      uid: user.uid,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      _version: user._version,
    };
  }

  /**
   * Checks if a user exists based on a filter.
   * @param filter - The filter to check the existence of a user.
   * @returns The ObjectId of the user if found, or null otherwise.
   */
  exists(filter: Parameters<UsersRepository['exists']>[0]): Promise<Types.ObjectId | null> {
    return this.usersRepository.exists(filter);
  }

  /**
   * Finds users based on a filter.
   * @param filter - The filter to find users.
   * @returns An array of user documents matching the filter.
   */
  find(filter: Parameters<UsersRepository['find']>[0]): Promise<UserDocument[]> {
    return this.usersRepository.find(filter);
  }

  /**
   * Finds a single user based on a filter.
   * @param filter - The filter to find a user.
   * @returns The user document if found, or null otherwise.
   */
  findOne(filter: Parameters<UsersRepository['findOne']>[0]): Promise<UserDocument | null> {
    return this.usersRepository.findOne(filter);
  }

  /**
   * Retrieves all users.
   * @returns An array of all user documents.
   */
  findAll(): Promise<UserDocument[]> {
    return this.usersRepository.findAll();
  }

  /**
   * Updates a single user based on a filter.
   * @param filter - The filter to find the user to update.
   * @param data - The data to update the user with.
   * @param options - Optional settings for the update operation.
   * @returns The result of the update operation.
   */
  updateOne(
    filter: Parameters<UsersRepository['updateOne']>[0],
    data: Parameters<UsersRepository['updateOne']>[1],
    options?: Parameters<UsersRepository['updateOne']>[2],
  ) {
    return this.usersRepository.updateOne(filter, data, options);
  }

  /**
   * Updates multiple users based on a filter.
   * @param filter - The filter to find the users to update.
   * @param data - The data to update the users with.
   * @param options - Optional settings for the update operation.
   * @returns The result of the update operation.
   */
  updateMany(
    filter: Parameters<UsersRepository['updateMany']>[0],
    data: Parameters<UsersRepository['updateMany']>[1],
    options?: Parameters<UsersRepository['updateMany']>[2],
  ) {
    return this.usersRepository.updateMany(filter, data, options);
  }

  /**
   * Finds a single user and updates it based on a filter.
   * @param filter - The filter to find the user to update.
   * @param data - The data to update the user with.
   * @param options - Optional settings for the update operation.
   * @returns The updated user document if found, or null otherwise.
   */
  findOneAndUpdate(
    filter: Parameters<UsersRepository['findOneAndUpdate']>[0],
    data: Parameters<UsersRepository['findOneAndUpdate']>[1],
    options?: Parameters<UsersRepository['findOneAndUpdate']>[2],
  ): Promise<UserDocument | null> {
    return this.usersRepository.findOneAndUpdate(filter, data, options);
  }

  /**
   * Creates new users.
   * @param data - The data for the users to create.
   * @param options - Optional settings for the create operation.
   * @returns An array of the created user documents.
   */
  create(
    data: Parameters<UsersRepository['create']>[0],
    options?: Parameters<UsersRepository['create']>[1],
  ): Promise<UserDocument[]> {
    return this.usersRepository.create(data, options);
  }

  /**
   * Finds a single user by UID.
   * @param uid - The UID of the user to find.
   * @returns The user document if found, or null otherwise.
   */
  findOneByUid(uid: string): Promise<UserDocument | null> {
    return this.findOne({ uid });
  }
}
