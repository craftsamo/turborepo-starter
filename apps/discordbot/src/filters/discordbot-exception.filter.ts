import { Catch, Logger, type ArgumentsHost } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import {
  BaseInteraction,
  type CacheType,
  ChannelType,
  type Guild,
  InteractionType,
  type RepliableInteraction,
  type TextBasedChannel,
  type User,
} from 'discord.js';
import { NecordArgumentsHost } from 'necord';

/**
 * Exception filter to handle Discord command execution errors.
 */
@Catch()
export class DiscordBotExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(DiscordBotExceptionFilter.name);

  getInteractionType(interaction: RepliableInteraction<CacheType>) {
    switch (interaction.type) {
      case InteractionType.ApplicationCommand:
        return {
          type: 'ApplicationCommand',
          id: interaction.id,
          name: interaction.commandName,
        };
      case InteractionType.MessageComponent:
        return {
          type: 'MessageComponent',
          id: interaction.id,
          customId: interaction.customId,
        };
      case InteractionType.ModalSubmit:
        return {
          type: 'ModalSubmit',
          id: interaction.id,
          customId: interaction.customId,
        };
      default: {
        return {
          id: 'Unknown',
          type: 'Unknown',
        };
      }
    }
  }

  getUserDetails(user: User) {
    if (!user) return null;
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
    };
  }

  getGuildDetails(guild: Guild | null) {
    if (!guild) return null;
    return {
      id: guild.id,
      name: guild.name,
    };
  }

  getChannelDetail(channel: TextBasedChannel | null) {
    if (!channel) return null;
    return {
      id: channel.id,
      name: channel.type === ChannelType.GuildText ? channel.name : null,
    };
  }

  async catch(exception: Error, host: ArgumentsHost) {
    const [interaction] = NecordArgumentsHost.create(host).getContext();

    if (interaction && interaction instanceof BaseInteraction && interaction.isRepliable()) {
      try {
        // Logger
        const interactionDetails = this.getInteractionType(interaction);
        const guildDetails = this.getGuildDetails(interaction.guild);
        const userDetails = this.getUserDetails(interaction.user);
        this.logger.error(
          `${guildDetails?.name || 'None'} ${interactionDetails.type} ${interactionDetails.name || 'None'} ${userDetails?.displayName || 'Unknown'} ${exception.message}`,
          {
            error: exception,
            interaction: interactionDetails,
            guild: this.getGuildDetails(interaction.guild),
            channel: this.getChannelDetail(interaction.channel),
            user: userDetails,
          },
        );

        // Reply to action user
        if (interaction.replied || interaction.deferred) {
          return interaction.editReply({ content: exception.message });
        }
        return interaction.reply({ content: exception.message, flags: 'Ephemeral' });
      } catch (e: unknown) {
        return interaction.followUp({ content: exception.message, flags: 'Ephemeral' });
      }
    }
  }
}
