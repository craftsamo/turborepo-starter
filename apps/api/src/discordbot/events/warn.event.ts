import { Injectable, Logger, UseFilters } from '@nestjs/common';
import { Context, On, type ContextOf } from 'necord';
import { DiscordBotExceptionFilter } from '../../filters';

@Injectable()
@UseFilters(DiscordBotExceptionFilter)
export class WarnEvent {
  private readonly logger = new Logger(WarnEvent.name);

  @On('warn')
  public onWarn(@Context() [message]: ContextOf<'warn'>) {
    this.logger.warn(message);
  }
}
