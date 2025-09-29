import { Injectable, Logger, UseFilters } from '@nestjs/common';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, DiscordjsError } from 'discord.js';
import { Ctx, Options, Subcommand, type SlashCommandContext } from 'necord';
import { CurrentTranslate, localizationMapByKey, type TranslationFn } from '@necord/localization';
import { NodeErrorMessage } from '@workspace/constants';
import type { ButtonCommandLocaleKey } from '../config/locales';
import { DiscordBotExceptionFilter } from '../filters';
import { ComponentCommandDecorator } from './decorators';
import { ButtonCommandDto } from './dtos';

@Injectable()
@UseFilters(DiscordBotExceptionFilter)
@ComponentCommandDecorator()
export class ButtonCommand {
  private readonly logger = new Logger(ButtonCommand.name);

  getTranslateKey(key: ButtonCommandLocaleKey) {
    return `commands.component.button.${key}`;
  }

  @Subcommand({
    name: 'button',
    description: 'Button command',
    nameLocalizations: localizationMapByKey('commands.component.button.name'),
    descriptionLocalizations: localizationMapByKey('commands.component.button.description'),
  })
  async run(@Ctx() [i]: SlashCommandContext, @CurrentTranslate() t: TranslationFn, @Options() options: ButtonCommandDto) {
    // ACK
    await i.deferReply({ flags: 'Ephemeral' });

    try {
      // Init action row
      const actionRow = new ActionRowBuilder<ButtonBuilder>();

      // Build buttons
      const button = new ButtonBuilder()
        .setCustomId('button/click')
        .setLabel(t(this.getTranslateKey('buttonLabel')))
        .setStyle(options.color || ButtonStyle.Primary);
      const dynamicButton = new ButtonBuilder()
        .setCustomId('button/' + Date.now().toString())
        .setLabel(t(this.getTranslateKey('buttonLabel')))
        .setStyle(options.color || ButtonStyle.Primary);
      actionRow.setComponents(button, dynamicButton);

      await i.editReply({
        content: t(this.getTranslateKey('messages.success')),
        components: [actionRow],
      });

      return this.logger.log(`${i.user.username} used the ${ButtonCommand.name} in ${i.guild?.name || 'Unknown Guild'}`, {
        color: options.color,
      });
    } catch (e: unknown) {
      // Nodejs Error
      if (e instanceof Error) {
        this.logger.error(e.message, e.stack, { error: e });
        return i.editReply(t(this.getTranslateKey('messages.nodeError')));
      }

      // DiscordJS Error
      if (e instanceof DiscordjsError) {
        this.logger.error(e.message, e.stack, { error: e });
        return i.editReply(t(this.getTranslateKey('messages.discordJsError')));
      }

      // Unknown Error
      this.logger.error(NodeErrorMessage.UnknownError.log, { error: e });
      return i.editReply(t(this.getTranslateKey('messages.unknownError')));
    }
  }
}
