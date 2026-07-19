import { ErrorMessage, languages, NodeErrorMessage } from '@workspace/constants';
import en from '@/i18n/messages/en.json';
import ja from '@/i18n/messages/ja.json';

function messageKeys(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object') return [prefix];

  return Object.entries(value).flatMap(([key, nestedValue]) =>
    messageKeys(nestedValue, prefix ? `${prefix}.${key}` : key),
  );
}

describe('localized messages', () => {
  it('keeps the English and Japanese dictionaries in sync', () => {
    expect(messageKeys(ja).sort()).toEqual(messageKeys(en).sort());
  });

  it('defines every language for error log and notice messages', () => {
    for (const message of [...Object.values(ErrorMessage), ...Object.values(NodeErrorMessage)]) {
      for (const language of languages) {
        expect(message.log[language]).not.toBe('');
        expect(message.notice[language]).not.toBe('');
      }
    }
  });
});
