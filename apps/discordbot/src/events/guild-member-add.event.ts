import { Injectable, Logger, UseFilters } from '@nestjs/common';
import { GuildMember } from 'discord.js';
import { Context, Once, type ContextOf } from 'necord';
import { ApiError, FetcherError } from '@workspace/http';
import { NodeErrorMessage } from '@workspace/constants';
import { DiscordBotExceptionFilter } from '../filters';
import { HttpsService } from '../services';

@Injectable()
@UseFilters(DiscordBotExceptionFilter)
export class GuildMemberAddEvent {
  private readonly logger = new Logger(GuildMemberAddEvent.name);

  constructor(private readonly httpsService: HttpsService) {}

  async createApiUser(guildMember: GuildMember) {
    const createdApiUser = await this.httpsService.createApiUser({
      discordId: guildMember.id,
      username: guildMember.user.username,
      displayName: guildMember.user.displayName,
    });
    this.logger.log(`The user "${guildMember.user.username}" has been created.`, {
      createdApiUser,
    });
    return createdApiUser;
  }

  async updateApiUser(guildMember: GuildMember) {
    const updatedUser = await this.httpsService.updateApiUser({
      username: guildMember.user.username,
      displayName: guildMember.user.displayName,
    });
    this.logger.log(`The user "${guildMember.user.username}" has been updated.`, {
      updatedUser,
    });
    return updatedUser;
  }

  @Once('guildMemberAdd')
  public async onGuildMemberAdd(@Context() [guildMember]: ContextOf<'guildMemberAdd'>) {
    try {
      const apiUser = await this.httpsService.fetchApiUser(guildMember.id);
      const newApiUser = apiUser
        ? // Update to APIUser
          await this.updateApiUser(guildMember)
        : // Create to APIUser
          await this.createApiUser(guildMember);

      // TODO: Create to APIGuildMember

      // TODO: Update to APIGuildMember

      return this.logger.log(`${guildMember.user.username} joined ${guildMember.guild.name}.`, {
        apiUser,
        newApiUser,
      });
    } catch (e: unknown) {
      // Coding Error
      if (e instanceof ApiError) {
        return this.logger.warn(e.message, { error: e });
      }

      // Infra or Setup Error
      if (e instanceof FetcherError) {
        return this.logger.warn(e.message, { error: e });
      }

      // Nodejs Error
      if (e instanceof Error) {
        return this.logger.error(e.message, e.stack, { error: e });
      }

      // Unknown Exceptions
      return this.logger.error(NodeErrorMessage.UnknownError.log, { error: e });
    }
  }
}
