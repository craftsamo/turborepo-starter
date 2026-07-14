'use client';

import { Laptop, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@workspace/ui/components/button';
import { toast } from '@workspace/ui/components/sonner';
import { HStack, VStack } from '@/components';

const themes = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Laptop },
] as const;

const modes = [
  { name: 'flow', detail: 'Natural document rhythm' },
  { name: 'full', detail: 'Viewport-sized sections' },
  { name: 'snap', detail: 'Focused slide navigation' },
] as const;

export const ThemeLayoutDemo = () => {
  const { setTheme } = useTheme();

  const selectTheme = (value: (typeof themes)[number]['value'], label: string) => {
    setTheme(value);
    toast(`Theme set to ${label}`, { description: 'The design tokens update instantly.' });
  };

  return (
    <div className='grid gap-4 sm:gap-6 lg:grid-cols-[0.9fr_1.1fr]'>
      <VStack
        gap={6}
        className='gap-4 rounded-xl border bg-card p-4 shadow-sm sm:gap-6 sm:p-8'
      >
        <VStack gap={2}>
          <span className='font-mono text-xs font-medium uppercase tracking-widest text-primary'>
            Theme provider
          </span>
          <p className='text-lg font-semibold'>One token system, three preferences.</p>
        </VStack>
        <HStack gap={2} wrap>
          {themes.map(({ value, label, icon: Icon }) => (
            <Button key={value} variant='outline' onClick={() => selectTheme(value, label)}>
              <Icon />
              {label}
            </Button>
          ))}
        </HStack>
        <div className='grid grid-cols-4 gap-2' aria-label='Theme color tokens'>
          <div className='h-12 rounded-md border bg-background' title='Background' />
          <div className='h-12 rounded-md bg-primary' title='Primary' />
          <div className='h-12 rounded-md bg-secondary' title='Secondary' />
          <div className='h-12 rounded-md bg-muted' title='Muted' />
        </div>
      </VStack>

      <VStack gap={3} className='rounded-xl border bg-card p-4 shadow-sm sm:p-8'>
        <span className='font-mono text-xs font-medium uppercase tracking-widest text-primary'>
          Screen modes
        </span>
        {modes.map((mode, index) => (
          <HStack
            key={mode.name}
            justify='between'
            className='w-full rounded-lg border bg-background p-3 sm:p-4'
          >
            <HStack gap={3}>
              <span className='font-mono text-xs text-muted-foreground'>0{index + 1}</span>
              <span className='font-mono text-sm font-semibold'>{mode.name}</span>
            </HStack>
            <span className='text-right text-sm text-muted-foreground'>{mode.detail}</span>
          </HStack>
        ))}
      </VStack>
    </div>
  );
};
