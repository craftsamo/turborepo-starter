'use client';

import { Laptop, Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { Button } from '@workspace/ui/components/button';
import { toast } from '@workspace/ui/components/sonner';
import { HStack, VStack } from '@/components';

const themes = [
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
  { value: 'system', icon: Laptop },
] as const;

const modes = [
  { value: 'flow', detail: 'flowDescription' },
  { value: 'full', detail: 'fullDescription' },
  { value: 'snap', detail: 'snapDescription' },
] as const;

export const ThemeLayoutDemo = () => {
  const { setTheme } = useTheme();
  const t = useTranslations('themeDemo');

  const selectTheme = (value: (typeof themes)[number]['value']) => {
    setTheme(value);
    toast(t('toastTitle', { theme: t(value) }), { description: t('toastDescription') });
  };

  return (
    <div className='grid gap-4 sm:gap-6 lg:grid-cols-[0.9fr_1.1fr]'>
      <VStack gap={6} className='gap-4 rounded-xl border bg-card p-4 shadow-sm sm:gap-6 sm:p-8'>
        <VStack gap={2}>
          <span className='font-mono text-xs font-medium uppercase tracking-widest text-primary'>
            {t('provider')}
          </span>
          <p className='text-lg font-semibold'>{t('summary')}</p>
        </VStack>
        <HStack gap={2} wrap>
          {themes.map(({ value, icon: Icon }) => (
            <Button key={value} variant='outline' onClick={() => selectTheme(value)}>
              <Icon />
              {t(value)}
            </Button>
          ))}
        </HStack>
        <div className='grid grid-cols-4 gap-2' aria-label={t('colorTokens')}>
          <div className='h-12 rounded-md border bg-background' title={t('background')} />
          <div className='h-12 rounded-md bg-primary' title={t('primary')} />
          <div className='h-12 rounded-md bg-secondary' title={t('secondary')} />
          <div className='h-12 rounded-md bg-muted' title={t('muted')} />
        </div>
      </VStack>

      <VStack gap={3} className='rounded-xl border bg-card p-4 shadow-sm sm:p-8'>
        <span className='font-mono text-xs font-medium uppercase tracking-widest text-primary'>
          {t('screenModes')}
        </span>
        {modes.map((mode, index) => (
          <HStack
            key={mode.value}
            justify='between'
            className='w-full rounded-lg border bg-background p-3 sm:p-4'
          >
            <HStack gap={3}>
              <span className='font-mono text-xs text-muted-foreground'>0{index + 1}</span>
              <span className='font-mono text-sm font-semibold'>{t(mode.value)}</span>
            </HStack>
            <span className='text-right text-sm text-muted-foreground'>{t(mode.detail)}</span>
          </HStack>
        ))}
      </VStack>
    </div>
  );
};
