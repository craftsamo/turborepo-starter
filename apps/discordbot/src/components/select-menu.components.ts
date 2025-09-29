import { Inject, Injectable, Logger, UseFilters } from '@nestjs/common';
import { Context, type StringSelectContext, SelectedStrings, StringSelect } from 'necord';
import { DefaultLocalizationAdapter, LOCALIZATION_ADAPTER } from '@necord/localization';
import type { SelectMenuCommandLocaleKey } from '../config/locales';
import { DiscordBotExceptionFilter } from '../filters';

@Injectable()
@UseFilters(DiscordBotExceptionFilter)
export class SelectMenuCumponent {
  private logger = new Logger(SelectMenuCumponent.name);

  constructor(
    @Inject(LOCALIZATION_ADAPTER)
    private readonly localizationAdapter: DefaultLocalizationAdapter,
  ) {}

  getTranslateKey(key: SelectMenuCommandLocaleKey) {
    return `component.selectMenu.${key}`;
  }

  @StringSelect('select/color')
  public async onStringSelectMenu(@Context() [i]: StringSelectContext, @SelectedStrings() selected: string[]) {
    this.logger.log(`${i.user.username} selected color.`, {
      selected,
    });

    const localeKey = this.getTranslateKey('messages.success');
    return i.reply(this.localizationAdapter.getTranslation(localeKey, i.locale) + '\n\n' + 'Values: ' + selected.join(','));
  }
}
