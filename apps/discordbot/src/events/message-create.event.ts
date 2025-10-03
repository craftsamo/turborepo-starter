import { Injectable, Logger, UseFilters } from '@nestjs/common';
import { ChannelType } from 'discord.js';
import { Context, On, type ContextOf } from 'necord';
import { DiscordBotExceptionFilter } from '../filters';

@Injectable()
@UseFilters(DiscordBotExceptionFilter)
export class MessageCreateEvent {
  private readonly logger = new Logger(MessageCreateEvent.name);

  @On('messageCreate')
  public async onMessageCreate(@Context() [message]: ContextOf<'messageCreate'>) {
    if (message.author.bot) return;

    if (
      message.channel.type === ChannelType.GuildText ||
      message.channel.type === ChannelType.GuildVoice ||
      message.channel.type === ChannelType.GuildStageVoice
    ) {
      await message.react('👀');
      const guildName = message.guild?.name || 'Unknown Guild';
      const channelName = message.channel.name;
      return this.logger.log(`${message.author.displayName} posted a message to the ${guildName}'s ${channelName}`, {
        content: message.content,
      });
    }
  }
}
