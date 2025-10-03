import { Injectable, Logger, UseFilters } from '@nestjs/common';
import { Context, Once, type ContextOf } from 'necord';
import { DiscordBotExceptionFilter } from '../filters';

@Injectable()
@UseFilters(DiscordBotExceptionFilter)
export class ClientReadyEvent {
  private readonly logger = new Logger(ClientReadyEvent.name);

  constructor() {}

  @Once('clientReady')
  public async onReady(@Context() [client]: ContextOf<'ready'>) {
    this.logger.log(`Bot logged in as ${client.user.username}`);
  }
}
