import { Controller, Get, Param, Req, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import type { Request } from 'express';
import type { APIRole } from '@workspace/types/api';
import { HttpExceptionFilter } from '../../../filters';
import { GuildNotFoundException, RoleNotFoundException } from '../../../exceptions';
import { HttpResponseInterceptor } from '../../../interceptors';
import { ValidGuildGuard } from '../guards';
import { GuildsService, RolesService } from '../services';

@Controller('guilds/:guildId/roles')
@UseGuards(ValidGuildGuard)
@UseFilters(HttpExceptionFilter)
@UseInterceptors(HttpResponseInterceptor)
export class RolesController {
  constructor(
    private guildsService: GuildsService,
    private rolesService: RolesService,
  ) {}

  @Get()
  async findAll(@Req() request: Request): Promise<APIRole[]> {
    const apiGuild = request.guild!;
    const guildObjectId = await this.guildsService.exists({ uid: apiGuild.uid });
    if (!guildObjectId) throw new GuildNotFoundException(apiGuild.uid);

    const roles = await this.rolesService.find({ guild: guildObjectId });
    return Promise.all(roles.map((role) => this.rolesService.toAPIRole(role)));
  }

  @Get(':roleId')
  async findOne(@Req() request: Request, @Param('roleId') roleId: string) {
    const apiGuild = request.guild!;
    const guildObjectId = await this.guildsService.exists({ uid: apiGuild.uid });
    if (!guildObjectId) throw new GuildNotFoundException(apiGuild.uid);

    const role = await this.rolesService.findOne({ guild: guildObjectId, uid: roleId });
    if (!role) throw new RoleNotFoundException(roleId);
    return this.rolesService.toAPIRole(role);
  }
}
