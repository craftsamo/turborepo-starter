import { Injectable, Logger, UseFilters } from '@nestjs/common';
import { Context, Once, type ContextOf } from 'necord';
import { DiscordBotExceptionFilter } from '../../filters';
import { ReadyService } from '../services';

@Injectable()
@UseFilters(DiscordBotExceptionFilter)
export class ReadyEvent {
  private readonly logger = new Logger(ReadyEvent.name);

  constructor(private readonly readyService: ReadyService) {}

  @Once('ready')
  public async onReady(@Context() [client]: ContextOf<'ready'>) {
    this.logger.log(`Bot logged in as ${client.user.username}`);

    await this.readyService.onApplicationBootstrap();
  }
}
