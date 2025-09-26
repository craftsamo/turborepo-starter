import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { type CreateGuildDetails, type APIGuild } from '@workspace/types/api';
import { AlreadyGuildExistsException } from '../../../exceptions';
import { type GuildDocument } from '../schemas';
import { GuildsRepository } from '../repositories';

/**
 * Service providing operations for managing Guild documents.
 * Includes methods to convert to API format, check existence, CRUD operations, and validation.
 */
@Injectable()
export class GuildsService {
  constructor(private guildRepository: GuildsRepository) {}

  /**
   * Convert a GuildDocument to the APIGuild format.
   * @param guild - The guild document to convert.
   * @returns The converted APIGuild object.
   */
  toAPIGuild(guild: GuildDocument): APIGuild {
    return {
      uid: guild.uid,
      name: guild.name,
      icon: guild.icon,
      createdAt: guild.createdAt.toISOString(),
      updatedAt: guild.updatedAt.toISOString(),
    };
  }

  /**
   * Check if a guild exists matching the given filter.
   * @param filter - Filter criteria for existence check.
   * @returns The ObjectId if found, otherwise null.
   */
  exists(filter: Parameters<GuildsRepository['exists']>[0]): Promise<Types.ObjectId | null> {
    return this.guildRepository.exists(filter);
  }

  /**
   * Find all guild documents.
   * @returns List of all GuildDocuments.
   */
  findAll(): Promise<GuildDocument[]> {
    return this.guildRepository.findAll();
  }

  /**
   * Find guild documents matching the given filter.
   * @param filter - The filter criteria.
   * @returns List of GuildDocuments matching the filter.
   */
  find(filter: Parameters<GuildsRepository['find']>[0]): Promise<GuildDocument[]> {
    return this.guildRepository.find(filter);
  }

  /**
   * Find a single guild matching the given filter.
   * @param filter - The filter criteria.
   * @returns The GuildDocument if found, otherwise null.
   */
  findOne(filter: Parameters<GuildsRepository['findOne']>[0]): Promise<GuildDocument | null> {
    return this.guildRepository.findOne(filter);
  }

  /**
   * Update multiple guild documents matching a filter.
   * @param filter - The filter criteria.
   * @param data - Data to update.
   * @param options - Optional update options.
   * @returns The result of the update operation.
   */
  updateMany(
    filter: Parameters<GuildsRepository['updateMany']>[0],
    data: Parameters<GuildsRepository['updateMany']>[1],
    options?: Parameters<GuildsRepository['updateMany']>[2],
  ) {
    return this.guildRepository.updateMany(filter, data, options);
  }

  /**
   * Update a single guild matching the filter.
   * @param filter - The filter criteria.
   * @param data - Data to update.
   * @param options - Optional update options.
   * @returns The result of the update operation.
   */
  updateOne(
    filter: Parameters<GuildsRepository['updateOne']>[0],
    data: Parameters<GuildsRepository['updateOne']>[1],
    options?: Parameters<GuildsRepository['updateOne']>[2],
  ) {
    return this.guildRepository.updateOne(filter, data, options);
  }

  /**
   * Find a single guild and update it.
   * @param filter - The filter criteria.
   * @param data - Data to update.
   * @param options - Optional update options.
   * @returns The result of the update operation.
   */
  findOneAndUpdate(
    filter: Parameters<GuildsRepository['findOneAndUpdate']>[0],
    data: Parameters<GuildsRepository['findOneAndUpdate']>[1],
    options?: Parameters<GuildsRepository['findOneAndUpdate']>[2],
  ) {
    return this.guildRepository.findOneAndUpdate(filter, data, options);
  }

  /**
   * Create new guild documents.
   * @param data - Data for the new guild(s).
   * @param options - Optional create options.
   * @returns The created GuildDocuments.
   */
  create(
    data: Parameters<GuildsRepository['create']>[0],
    options?: Parameters<GuildsRepository['create']>[1],
  ): Promise<GuildDocument[]> {
    return this.guildRepository.create(data, options);
  }

  /**
   * Validate that a guild with the given UID does not already exist.
   * Throws AlreadyGuildExistsException if a duplicate is found.
   * @param data - The guild creation details.
   */
  async validateCreate(data: CreateGuildDetails) {
    const isExists = await this.exists({ uid: data.uid });
    if (isExists) throw new AlreadyGuildExistsException(data.uid);
  }
}
