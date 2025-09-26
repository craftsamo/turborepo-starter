import { Injectable, Logger, UseFilters } from '@nestjs/common';
import { Context, Once, type ContextOf } from 'necord';
import { DiscordBotExceptionFilter } from '../filters';

@Injectable()
@UseFilters(DiscordBotExceptionFilter)
export class ReadyEvent {
  private readonly logger = new Logger(ReadyEvent.name);

  constructor() {}

  @Once('clientReady')
  public async onReady(@Context() [client]: ContextOf<'ready'>) {
    this.logger.log(`Bot logged in as ${client.user.username}`);
  }
}
