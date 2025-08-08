import { Controller, Get, Param, Req, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import type { Request } from 'express';
import { Types } from 'mongoose';
import type { APIRole } from '@workspace/types/api';
import { HttpExceptionFilter } from '../../../filters';
import { RoleNotFoundException } from '../../../exceptions';
import { HttpResponseInterceptor } from '../../../interceptors';
import { ValidGuildGuard } from '../guards';
import { RolesService } from '../services';

@Controller('guilds/:guildId/roles')
@UseGuards(ValidGuildGuard)
@UseFilters(HttpExceptionFilter)
@UseInterceptors(HttpResponseInterceptor)
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get()
  async findAll(@Req() request: Request): Promise<APIRole[]> {
    const guild = request.guild!;
    const roles = await this.rolesService.find({ guild: new Types.ObjectId(guild._id) });
    return Promise.all(roles.map((role) => this.rolesService.toAPIRole(role)));
  }

  @Get(':roleId')
  async findOne(@Req() request: Request, @Param('roleId') roleId: string) {
    const guild = request.guild!;
    const role = await this.rolesService.findOne({ guild: new Types.ObjectId(guild._id), uid: roleId });
    if (!role) throw new RoleNotFoundException(roleId);
    return this.rolesService.toAPIRole(role);
  }
}
