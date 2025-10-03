import { ButtonStyle } from 'discord.js';
import { IntegerOption } from 'necord';

export class ButtonCommandDto {
  @IntegerOption({
    name: 'color',
    description: 'Button color',
    choices: [
      { name: 'Primary', value: ButtonStyle.Primary },
      { name: 'Secondary', value: ButtonStyle.Secondary },
      { name: 'Success', value: ButtonStyle.Success },
      { name: 'Danger', value: ButtonStyle.Danger },
      { name: 'Link', value: ButtonStyle.Primary },
    ],
  })
  color?: ButtonStyle;
}
