import { Injectable, Logger, UseFilters } from '@nestjs/common';
import { Context, On, type ContextOf } from 'necord';
import { DiscordBotExceptionFilter } from '../filters';

@Injectable()
@UseFilters(DiscordBotExceptionFilter)
export class MessageEvent {
  private readonly logger = new Logger(MessageEvent.name);

  @On('messageCreate')
  public async onMessageCreate(@Context() [message]: ContextOf<'messageCreate'>) {
    if (message.author.bot) return;
    await message.react(':eyes:');
    this.logger.log(message.content, { author: message.author.username });
  }
}
