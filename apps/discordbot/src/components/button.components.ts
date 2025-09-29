import { Inject, Injectable, Logger, UseFilters } from '@nestjs/common';
import { Context, Button, type ButtonContext, ComponentParam } from 'necord';
import { DefaultLocalizationAdapter, LOCALIZATION_ADAPTER } from '@necord/localization';
import type { ButtonComponentLocaleKey } from '../config/locales';
import { DiscordBotExceptionFilter } from '../filters';

@Injectable()
@UseFilters(DiscordBotExceptionFilter)
export class ButtonComponent {
  private logger = new Logger(ButtonComponent.name);

  constructor(
    @Inject(LOCALIZATION_ADAPTER)
    private readonly localizationAdapter: DefaultLocalizationAdapter,
  ) {}

  getTranslateKey(key: ButtonComponentLocaleKey) {
    return `component.button.${key}`;
  }

  @Button('button/click')
  public onButton(@Context() [i]: ButtonContext, @ComponentParam('value') value: string) {
    this.logger.log(`${i.user.username} clicked the "${value}" button.`);

    const localeKey = this.getTranslateKey('messages.success');
    return i.reply(this.localizationAdapter.getTranslation(localeKey, i.locale));
  }

  @Button('button/:value')
  public onDynamicButton(@Context() [i]: ButtonContext, @ComponentParam('value') value: string) {
    const ts = Number(value);
    const date = Number.isFinite(ts) ? new Date(ts).toLocaleString() : value;
    this.logger.log(`${i.user.username} clicked the button at ${date}.`);

    const localeKey = this.getTranslateKey('messages.success');
    return i.reply(this.localizationAdapter.getTranslation(localeKey, i.locale));
  }
}
