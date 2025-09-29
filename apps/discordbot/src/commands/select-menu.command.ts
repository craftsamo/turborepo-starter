import { Injectable, Logger, UseFilters } from '@nestjs/common';
import { ActionRowBuilder, DiscordjsError, StringSelectMenuBuilder } from 'discord.js';
import { Ctx, Options, Subcommand, type SlashCommandContext } from 'necord';
import { CurrentTranslate, localizationMapByKey, type TranslationFn } from '@necord/localization';
import { NodeErrorMessage } from '@workspace/constants';
import type { SelectMenuCommandLocaleKey } from '../config/locales';
import { DiscordBotExceptionFilter } from '../filters';
import { ComponentCommandDecorator } from './decorators';
import { SelectMenuCommandDto } from './dtos';

@Injectable()
@UseFilters(DiscordBotExceptionFilter)
@ComponentCommandDecorator()
export class SelectMenuCommand {
  private readonly logger = new Logger(SelectMenuCommand.name);

  getTranslateKey(key: SelectMenuCommandLocaleKey) {
    return `commands.component.selectMenu.${key}`;
  }

  @Subcommand({
    name: 'select_menu',
    description: 'SelectMenu command',
    nameLocalizations: localizationMapByKey('commands.component.selectMenu.name'),
    descriptionLocalizations: localizationMapByKey('commands.component.selectMenu.description'),
  })
  async run(@Ctx() [i]: SlashCommandContext, @CurrentTranslate() t: TranslationFn, @Options() options: SelectMenuCommandDto) {
    // ACK
    await i.deferReply({ flags: 'Ephemeral' });

    try {
      // Init action row
      const actionRow = new ActionRowBuilder<StringSelectMenuBuilder>();

      // Build select menus
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('select/color')
        .setPlaceholder(t(this.getTranslateKey('placeholder')))
        .setMaxValues(options.maxValue || 1)
        .setMinValues(options.minValue || 1)
        .setOptions([
          { label: 'Red', value: 'Red' },
          { label: 'Blue', value: 'Blue' },
          { label: 'Yellow', value: 'Yellow' },
        ]);
      actionRow.setComponents(selectMenu);

      await i.editReply({
        content: t(this.getTranslateKey('messages.success')),
        components: [actionRow],
      });

      return this.logger.log(`${i.user.username} used the ${SelectMenuCommand.name} in ${i.guild?.name || 'Unknown Guild'}`, {
        minValue: options.minValue,
        maxValue: options.maxValue,
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
