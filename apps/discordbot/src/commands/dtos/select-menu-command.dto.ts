import { IntegerOption } from 'necord';

export class SelectMenuCommandDto {
  @IntegerOption({
    name: 'max_value',
    description: 'Maximum Selectable Number',
    min_value: 1,
    max_value: 3,
  })
  maxValue?: number;

  @IntegerOption({
    name: 'min_value',
    description: 'Minimum Selectable Number',
    min_value: 1,
    max_value: 3,
  })
  minValue?: number;
}
