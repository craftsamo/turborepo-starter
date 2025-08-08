import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NecordModule } from 'necord';
import { IntentsBitField } from 'discord.js';
import type { EnvironmentVariables } from '../config/env-validation';
import { UsersModule } from '../modules/users';
import { GuildsModule } from '../modules/guilds';
import * as Events from './events';
import * as Services from './services';
import * as PublicCommands from './commands/publics';
import * as DynamicCommands from './commands/dynamics';

@Module({
  imports: [
    NecordModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService<EnvironmentVariables>) => ({
        token: configService.get('DISCORD_BOT_TOKEN')!,
        intents: [
          IntentsBitField.Flags.Guilds,
          IntentsBitField.Flags.GuildMessages,
          IntentsBitField.Flags.MessageContent,
          IntentsBitField.Flags.DirectMessages,
        ],
        skipRegistration: true,
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    GuildsModule,
  ],
  providers: [PublicCommands, DynamicCommands, Events, Services].map((e) => Object.values(e)).flat(),
})
export class DiscordBotModule {}
