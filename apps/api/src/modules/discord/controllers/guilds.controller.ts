import { Controller, Get, Param, UseFilters, UseInterceptors } from '@nestjs/common';
import { type DiscordAPIGuild } from '@workspace/types/api';
import { HttpResponseInterceptor } from '../../../interceptors';
import { HttpExceptionFilter } from '../../../filters';
import { DiscordGuildsService } from '../services';

@UseFilters(HttpExceptionFilter)
@UseInterceptors(HttpResponseInterceptor)
@Controller('discord/guilds')
export class DiscordGuildsController {
  constructor(private readonly discordGuildsService: DiscordGuildsService) {}

  @Get(':guildId')
  getGuild(@Param('guildId') guildId: string): Promise<DiscordAPIGuild> {
    return this.discordGuildsService.fetchGuild(guildId);
  }
}
