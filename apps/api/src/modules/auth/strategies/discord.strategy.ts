import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { type Profile as DiscordProfile, Strategy } from 'passport-discord';
import type { DiscordAuthProfile } from '@workspace/types/api';
import type { EnvironmentVariables } from '../../../config/env-validation';
import { DiscordAuthService } from '../services';

type Done = (error: Error | null, profile: DiscordAuthProfile | null) => void;

@Injectable()
export class DiscordStrategy extends PassportStrategy(Strategy) {
  constructor(
    protected readonly configService: ConfigService<EnvironmentVariables>,
    private readonly discordAuthService: DiscordAuthService,
  ) {
    super({
      clientID: configService.get('DISCORD_CLIENT_ID')!,
      clientSecret: configService.get('DISCORD_CLIENT_SECRET')!,
      callbackURL: configService.get('BASE_URL') + '/api/auth/discord/callback',
      scope: ['identify', 'email', 'guilds', 'guilds.join'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: DiscordProfile, done: Done) {
    const user = await this.discordAuthService.findUserByDiscordId(profile.id);

    // If the user exists, update the latest information and log in
    if (user) {
      await this.discordAuthService.updateUser(profile.id, profile.global_name || profile.displayName, profile.username);
      done(null, { profile, accessToken, refreshToken });
    }

    // If the user does not exist, create a new user and log in
    else {
      await this.discordAuthService.createUser(profile.id, profile.global_name || profile.displayName, profile.username);
      done(null, { profile, accessToken, refreshToken });
    }
  }
}
