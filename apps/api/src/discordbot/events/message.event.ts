import { Injectable, Logger, UseFilters } from '@nestjs/common';
import { Context, On, type ContextOf } from 'necord';
import { DiscordBotExceptionFilter } from '../../filters';

@Injectable()
@UseFilters(DiscordBotExceptionFilter)
export class MessageEvent {
  private readonly logger = new Logger(MessageEvent.name);

  @On('messageCreate')
  public onMessageCreate(@Context() [message]: ContextOf<'messageCreate'>) {
    if (message.author.bot) return;
    this.logger.log(message.content, { author: message.author.username });
  }
}
