import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import type { DiscordAuthProfile } from '@workspace/types/api';
import { DiscordGuildMembersService } from '../services';

@Injectable()
export class GuildMemberGuard implements CanActivate {
  constructor(private discordGuildMembersService: DiscordGuildMembersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const user = request.user as DiscordAuthProfile | undefined | null;
    const guildId = request.params.guildId as string | undefined | null;
    if (!user || !guildId) return false;

    try {
      const guildMember = await this.discordGuildMembersService.me(guildId, user.accessToken);
      if (!guildMember) return false;

      request.guildMember = guildMember;

      return true;
    } catch (error) {
      return false;
    }
  }
}
