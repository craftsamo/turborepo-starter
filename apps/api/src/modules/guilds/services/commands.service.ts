import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import type { CreateCommandDetails, APICommand } from '@workspace/types/api';
import { AlreadyCommandExistsException } from '../../../exceptions';
import { GuildsService } from '../services';
import type { GuildDocument, CommandDocument } from '../schemas';
import { CommandsRepository } from '../repositories';

@Injectable()
/**
 * Service for managing commands within guilds.
 * Provides methods for resolving guild documents, converting commands to API format,
 * and CRUD operations on commands.
 */
export class CommandsService {
  /**
   * Constructor to inject dependencies.
   * @param guildsService - Service to handle guild operations.
   * @param commandsRepository - Repository to handle command data access.
   */
  constructor(
    private readonly guildsService: GuildsService,
    private readonly commandsRepository: CommandsRepository,
  ) {}

  /**
   * Resolves the guild documents from a command document.
   * @param command - The command document containing guild references.
   * @returns An array of resolved GuildDocument instances.
   */
  async resolveGuildsDocument(command: CommandDocument): Promise<GuildDocument[]> {
    return (
      command.guilds instanceof Types.ObjectId ? (await command.populate('guilds')).guilds : command.guilds
    ) as GuildDocument[];
  }

  /**
   * Converts a command document to an API command object.
   * @param command - The command document to convert.
   * @returns The APICommand representation of the command.
   */
  async toAPICommand(command: CommandDocument): Promise<APICommand> {
    const guilds = await this.resolveGuildsDocument(command);
    const apiGuilds = guilds.length > 0 ? await Promise.all(guilds.map((guild) => this.guildsService.toAPIGuild(guild))) : [];

    return {
      uid: command.uid,
      name: command.name,
      description: command.description,
      disabled: command.disabled,
      guilds: apiGuilds,
      createdAt: command.createdAt.toISOString(),
      updatedAt: command.updatedAt.toISOString(),
    };
  }

  /**
   * Checks if a command exists based on the provided filter.
   * @param filter - The filter criteria.
   * @returns The ObjectId of the existing command, or null if not found.
   */
  exists(filter: Parameters<CommandsRepository['exists']>[0]): Promise<Types.ObjectId | null> {
    return this.commandsRepository.exists(filter);
  }

  /**
   * Finds commands based on the provided filter.
   * @param filter - The filter criteria.
   * @returns An array of CommandDocument instances.
   */
  find(filter: Parameters<CommandsRepository['find']>[0]): Promise<CommandDocument[]> {
    return this.commandsRepository.find(filter);
  }

  /**
   * Finds a single command based on the provided filter.
   * @param filter - The filter criteria.
   * @returns A CommandDocument instance or null.
   */
  findOne(filter: Parameters<CommandsRepository['findOne']>[0]): Promise<CommandDocument | null> {
    return this.commandsRepository.findOne(filter);
  }

  /**
   * Updates multiple commands based on the provided filter and data.
   * @param filter - The filter criteria.
   * @param data - The data to update.
   * @param options - Optional update options.
   */
  updateMany(
    filter: Parameters<CommandsRepository['updateMany']>[0],
    data: Parameters<CommandsRepository['updateMany']>[1],
    options?: Parameters<CommandsRepository['updateMany']>[2],
  ) {
    return this.commandsRepository.updateMany(filter, data, options);
  }

  /**
   * Updates a single command based on the provided filter and data.
   * @param filter - The filter criteria.
   * @param data - The data to update.
   * @param options - Optional update options.
   */
  updateOne(
    filter: Parameters<CommandsRepository['updateOne']>[0],
    data: Parameters<CommandsRepository['updateOne']>[1],
    options?: Parameters<CommandsRepository['updateOne']>[2],
  ) {
    return this.commandsRepository.updateOne(filter, data, options);
  }

  /**
   * Finds and updates a single command based on the provided filter and data.
   * @param filter - The filter criteria.
   * @param data - The data to update.
   * @param options - Optional update options.
   */
  findOneAndUpdate(
    filter: Parameters<CommandsRepository['findOneAndUpdate']>[0],
    data: Parameters<CommandsRepository['findOneAndUpdate']>[1],
    options?: Parameters<CommandsRepository['findOneAndUpdate']>[2],
  ) {
    return this.commandsRepository.findOneAndUpdate(filter, data, options);
  }

  /**
   * Creates new commands in the database.
   * @param data - The command data to create.
   * @param options - Optional creation options.
   * @returns An array of CommandDocument instances.
   */
  create(
    data: Parameters<CommandsRepository['create']>[0],
    options?: Parameters<CommandsRepository['create']>[1],
  ): Promise<CommandDocument[]> {
    return this.commandsRepository.create(data, options);
  }

  /**
   * Validates if a command can be created by checking for existence.
   * Throws AlreadyCommandExistsException if a duplicate is found.
   * @param data - The CreateCommandDetails object.
   */
  async validateCreate(data: CreateCommandDetails) {
    const isExists = await this.exists({ uid: data.uid });
    if (isExists) throw new AlreadyCommandExistsException(data.uid);
  }
}
