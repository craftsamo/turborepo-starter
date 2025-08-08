import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { GuildNotFoundException, InvalidParameterException } from '../../../exceptions';
import { GuildsService } from '../services';

@Injectable()
export class ValidGuildGuard implements CanActivate {
  constructor(private guildsService: GuildsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const guildId = request.params.guildId as string | undefined | null;
    if (!guildId) {
      throw new InvalidParameterException('guildId');
    }

    const guild = await this.guildsService.findOne({ uid: guildId });
    if (!guild) {
      throw new GuildNotFoundException(guildId);
    }

    request.guild = this.guildsService.toAPIGuild(guild);

    return true;
  }
}
