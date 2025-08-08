import { Injectable } from '@nestjs/common';
import { Types, type UpdateWriteOpResult } from 'mongoose';
import { type APIRole, type CreateRoleDetails } from '@workspace/types/api';
import { AlreadyRoleExistsException } from '../../../exceptions';
import { GuildsService } from '../services';
import { type GuildDocument, type RoleDocument } from '../schemas';
import { RolesRepository } from '../repositories';

/**
 * Service for handling Role-related operations. Provides methods for converting Role documents
 * to API representations, validating creation, and delegating CRUD operations to the repository.
 */
@Injectable()
export class RolesService {
  constructor(
    private rolesRepository: RolesRepository,
    private guildsService: GuildsService,
  ) {}

  /**
   * Resolves and returns the GuildDocument associated with the given RoleDocument.
   * If the guild is not populated, it will populate it first.
   * @param role The RoleDocument instance to resolve the guild for.
   * @returns The corresponding GuildDocument.
   */
  async resolveGuildDocument(role: RoleDocument): Promise<GuildDocument> {
    return role.guild instanceof Types.ObjectId
      ? ((await role.populate('guild')).guild as GuildDocument)
      : (role.guild as GuildDocument);
  }

  /**
   * Converts a RoleDocument into an APIRole for API responses.
   * @param role The RoleDocument instance to convert.
   * @returns The APIRole representation.
   */
  async toAPIRole(role: RoleDocument): Promise<APIRole> {
    const guildDocument = await this.resolveGuildDocument(role);

    return {
      _id: role._id.toString(),
      uid: role.uid,
      name: role.name,
      guild: this.guildsService.toAPIGuild(guildDocument),
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
      _version: role._version,
    };
  }

  /**
   * Checks if a role exists matching the given filter.
   * @param filter Query filter.
   * @returns The ObjectId if exists, otherwise null.
   */
  exists(filter: Parameters<RolesRepository['exists']>[0]): Promise<Types.ObjectId | null> {
    return this.rolesRepository.exists(filter);
  }

  /**
   * Finds and returns all RoleDocuments.
   * @returns Array of RoleDocuments.
   */
  findAll(): Promise<RoleDocument[]> {
    return this.rolesRepository.findAll();
  }

  /**
   * Finds roles matching the given filter.
   * @param filter Query filter.
   * @returns Array of matching RoleDocuments.
   */
  find(filter: Parameters<RolesRepository['find']>[0]): Promise<RoleDocument[]> {
    return this.rolesRepository.find(filter);
  }

  /**
   * Finds one role matching the given filter.
   * @param filter Query filter.
   * @returns The matching RoleDocument or null.
   */
  findOne(filter: Parameters<RolesRepository['findOne']>[0]): Promise<RoleDocument | null> {
    return this.rolesRepository.findOne(filter);
  }

  /**
   * Creates new roles.
   * @param data Role creation data.
   * @param options Optional creation options.
   * @returns Array of created RoleDocuments.
   */
  create(
    data: Parameters<RolesRepository['create']>[0],
    options?: Parameters<RolesRepository['create']>[1],
  ): Promise<RoleDocument[]> {
    return this.rolesRepository.create(data, options);
  }

  /**
   * Updates multiple roles matching the filter.
   * @param filter Query filter.
   * @param data Update data.
   * @param options Optional update options.
   * @returns Update result.
   */
  updateMany(
    filter: Parameters<RolesRepository['updateMany']>[0],
    data: Parameters<RolesRepository['updateMany']>[1],
    options?: Parameters<RolesRepository['updateMany']>[2],
  ): Promise<UpdateWriteOpResult> {
    return this.rolesRepository.updateMany(filter, data, options);
  }

  /**
   * Updates one role matching the filter.
   * @param filter Query filter.
   * @param data Update data.
   * @param options Optional update options.
   * @returns Update result.
   */
  updateOne(
    filter: Parameters<RolesRepository['updateOne']>[0],
    data: Parameters<RolesRepository['updateOne']>[1],
    options?: Parameters<RolesRepository['updateOne']>[2],
  ): Promise<UpdateWriteOpResult> {
    return this.rolesRepository.updateOne(filter, data, options);
  }

  /**
   * Finds a role and updates it.
   * @param filter Query filter.
   * @param data Update data.
   * @param options Optional update options.
   * @returns The updated RoleDocument or null.
   */
  findOneAndUpdate(
    filter: Parameters<RolesRepository['findOneAndUpdate']>[0],
    data: Parameters<RolesRepository['findOneAndUpdate']>[1],
    options?: Parameters<RolesRepository['findOneAndUpdate']>[2],
  ): Promise<RoleDocument | null> {
    return this.rolesRepository.findOneAndUpdate(filter, data, options);
  }

  /**
   * Validates creation of a new role. Throws an exception if a role with the same uid already exists.
   * @param data Role creation details.
   */
  async validateCreate(data: CreateRoleDetails) {
    const isExists = await this.exists({ uid: data.uid });
    if (isExists) throw new AlreadyRoleExistsException(data.uid);
  }
}
