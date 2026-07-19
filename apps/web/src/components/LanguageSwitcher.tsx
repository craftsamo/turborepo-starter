'use client';

import { Globe2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@workspace/ui/components/button';
import { cn } from '@workspace/ui/lib/utils';
import { useLocaleSwitch } from '@/i18n/use-locale-switch';

interface LanguageSwitcherProps {
  className?: string;
  hideLabel?: boolean;
  mode: 'bottom' | 'toolbar';
}

export const LanguageSwitcher = ({ className, hideLabel = false, mode }: LanguageSwitcherProps) => {
  const t = useTranslations('language');
  const { locale, options, isPending, switchLocale } = useLocaleSwitch();

  if (mode === 'bottom') {
    const nextLocale = options.find((option) => option.code !== locale) ?? options[0];

    return (
      <button
        type='button'
        className={cn(className, 'border-0 bg-transparent')}
        aria-label={t('switchTo', { language: nextLocale.label })}
        disabled={isPending}
        onClick={() => switchLocale(nextLocale.code)}
      >
        <Globe2 aria-hidden='true' className='size-5' />
        <span className={hideLabel ? 'sr-only' : undefined}>{nextLocale.shortLabel}</span>
      </button>
    );
  }

  return (
    <div
      role='group'
      aria-label={t('label')}
      className='inline-flex items-center rounded-full bg-muted/60 p-0.5'
    >
      {options.map((option) => (
        <Button
          key={option.code}
          type='button'
          size='sm'
          variant='ghost'
          aria-pressed={locale === option.code}
          aria-label={t('switchTo', { language: option.label })}
          disabled={isPending || locale === option.code}
          className={cn(
            'h-7 rounded-full px-2 font-mono text-[0.6875rem]',
            locale === option.code && 'bg-background text-foreground shadow-xs opacity-100',
          )}
          onClick={() => switchLocale(option.code)}
        >
          {option.shortLabel}
        </Button>
      ))}
    </div>
  );
};
