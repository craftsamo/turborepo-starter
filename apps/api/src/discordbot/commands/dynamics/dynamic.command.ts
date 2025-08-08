import { Injectable, UseFilters } from '@nestjs/common';
import { MessageFlags } from 'discord.js';
import { Ctx, SlashCommand, type SlashCommandContext } from 'necord';
import { DiscordBotExceptionFilter } from '../../../filters';

@Injectable()
@UseFilters(DiscordBotExceptionFilter)
export class DynamicCommand {
  @SlashCommand({
    name: 'dynamic',
    description: 'This is a dynamic command',
  })
  async run(@Ctx() [i]: SlashCommandContext) {
    return i.reply({ content: 'I am so dynamic !! 😎', flags: MessageFlags.Ephemeral });
  }
}
