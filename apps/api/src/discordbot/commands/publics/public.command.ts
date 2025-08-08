import { Injectable, UseFilters } from '@nestjs/common';
import { MessageFlags } from 'discord.js';
import { Ctx, SlashCommand, type SlashCommandContext } from 'necord';
import { DiscordBotExceptionFilter } from '../../../filters';

@Injectable()
@UseFilters(DiscordBotExceptionFilter)
export class PublicCommand {
  @SlashCommand({ name: 'ping', description: 'Bot status' })
  async run(@Ctx() [i]: SlashCommandContext) {
    return i.reply({ content: 'Pong !', flags: MessageFlags.Ephemeral });
  }
}
