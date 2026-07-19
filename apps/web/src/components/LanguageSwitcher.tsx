'use client';

import { Languages, LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@workspace/ui/components/button';
import { cn } from '@workspace/ui/lib/utils';
import { useLocaleSwitch } from '@/i18n/use-locale-switch';

interface LanguageSwitcherProps {
  className?: string;
  /** Visually hide the language name (it stays in the accessible name). */
  hideLabel?: boolean;
  mode: 'bottom' | 'toolbar';
}

/**
 * One quiet button that names the other language in its own script ("日本語"
 * on English pages, "English" on Japanese pages), so a reader who cannot read
 * the current language still finds it.
 *
 * `bottom` renders a plain, unstyled `<button>` the caller styles (bottom
 * bar); `toolbar` renders a ghost `Button` for the toolbar.
 */
export const LanguageSwitcher = ({ className, hideLabel = false, mode }: LanguageSwitcherProps) => {
  const t = useTranslations('language');
  const { locale, options, isPending, switchLocale } = useLocaleSwitch();
  const nextLocale = options.find((option) => option.code !== locale) ?? options[0];

  const buttonProps = {
    type: 'button',
    'aria-label': t('switchTo', { language: nextLocale.label }),
    // Not `disabled`: a disabled button drops keyboard focus to the page while the next document loads.
    'aria-disabled': isPending || undefined,
    'aria-busy': isPending || undefined,
    onClick: () => switchLocale(nextLocale.code),
  } as const;

  const renderContent = (iconClassName: string) => (
    <>
      {isPending ? (
        <LoaderCircle
          aria-hidden='true'
          className={cn(iconClassName, 'animate-spin motion-reduce:animate-none')}
        />
      ) : (
        <Languages aria-hidden='true' className={iconClassName} />
      )}
      <span lang={nextLocale.code} className={hideLabel ? 'sr-only' : undefined}>
        {nextLocale.label}
      </span>
    </>
  );

  if (mode === 'bottom') {
    return (
      <button
        {...buttonProps}
        className={cn('border-0 bg-transparent aria-disabled:opacity-50', className)}
      >
        {renderContent('size-5')}
      </button>
    );
  }

  return (
    <Button
      {...buttonProps}
      variant='ghost'
      size='sm'
      className={cn(
        'text-muted-foreground hover:text-foreground aria-disabled:opacity-50',
        className,
      )}
    >
      {renderContent('size-4')}
    </Button>
  );
};
