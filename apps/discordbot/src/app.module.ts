import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IntentsBitField } from 'discord.js';
import { NecordModule } from 'necord';
import { NestedLocalizationAdapter, NecordLocalizationModule, UserResolver } from '@necord/localization';
import { EnvironmentVariables, validationSchemaForEnv } from './config/env-validation';
import { locales } from './config/locales';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: validationSchemaForEnv,
    }),
    NecordModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService<EnvironmentVariables>) => ({
        token: configService.get('DISCORD_BOT_TOKEN')!,
        intents: [
          IntentsBitField.Flags.Guilds,
          IntentsBitField.Flags.GuildMembers,
          IntentsBitField.Flags.GuildMessages,
          IntentsBitField.Flags.MessageContent,
          IntentsBitField.Flags.DirectMessages,
        ],
        development: configService.get('TEST_GUILD'),
      }),
      inject: [ConfigService],
    }),
    NecordLocalizationModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async () => ({
        resolvers: UserResolver,
        adapter: new NestedLocalizationAdapter({
          fallbackLocale: 'en-US',
          locales,
        }),
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
