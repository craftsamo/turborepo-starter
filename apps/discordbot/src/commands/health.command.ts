import { Injectable, Logger, UseFilters } from '@nestjs/common';
import { DiscordjsError } from 'discord.js';
import { Ctx, SlashCommand, type SlashCommandContext } from 'necord';
import { NodeErrorMessage } from '@workspace/constants';
import { DiscordBotExceptionFilter } from '../filters';
import { HttpsService } from '../services';

@Injectable()
@UseFilters(DiscordBotExceptionFilter)
export class HealthCommand {
  private readonly logger = new Logger(HealthCommand.name);

  constructor(private readonly httpsService: HttpsService) {}

  @SlashCommand({
    name: 'health',
    description: 'Health check command',
  })
  async run(@Ctx() [i]: SlashCommandContext) {
    // ACK
    await i.deferReply({ flags: 'Ephemeral' });

    try {
      const result = await this.httpsService.health();
      await i.editReply(result.message);
      return this.logger.log(`${i.user.username} used the ${HealthCommand.name} in ${i.guild?.name || 'Unknown Guild'}`, {
        result,
      });
    } catch (e: unknown) {
      // Nodejs Error
      if (e instanceof Error) {
        this.logger.error(e.message, e.stack, { error: e });
        return i.editReply(e.message);
      }

      // DiscordJS Error
      if (e instanceof DiscordjsError) {
        this.logger.error(e.message, e.stack, { error: e });
        return i.editReply(e.message);
      }

      // Unknown Error
      this.logger.error(NodeErrorMessage.UnknownError.log, { error: e });
      return i.editReply('Unknown error.');
    }
  }
}
