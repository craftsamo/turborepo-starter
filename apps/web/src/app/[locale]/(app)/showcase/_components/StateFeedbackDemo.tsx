'use client';

import { Minus, Plus, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { toast } from '@workspace/ui/components/sonner';
import { HStack, VStack } from '@/components';
import { useAppDispatch, useAppSelector } from '@/store';
import { decrement, increment, reset } from '@/store/slices/counter';

export const StateFeedbackDemo = () => {
  const count = useAppSelector((state) => state.counter.value);
  const dispatch = useAppDispatch();

  const updateCount = (action: 'decrement' | 'increment' | 'reset') => {
    if (action === 'decrement') dispatch(decrement());
    if (action === 'increment') dispatch(increment());
    if (action === 'reset') dispatch(reset());

    toast.success(action === 'reset' ? 'Counter reset' : `Counter ${action}ed`, {
      description: 'Redux updated the shared state.',
    });
  };

  return (
    <VStack
      gap={6}
      className='relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm sm:p-8'
    >
      <div className='pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-primary/10 blur-3xl' />
      <HStack justify='between' className='w-full'>
        <span className='font-mono text-xs font-medium uppercase tracking-widest text-muted-foreground'>
          store.counter.value
        </span>
        <Sparkles className='size-4 text-primary' aria-hidden='true' />
      </HStack>
      <output
        aria-label='Counter value'
        className='font-mono text-7xl font-semibold tabular-nums tracking-tighter sm:text-8xl'
      >
        {count}
      </output>
      <HStack gap={2} wrap className='w-full'>
        <Button
          variant='outline'
          size='icon'
          aria-label='Decrease counter'
          onClick={() => updateCount('decrement')}
        >
          <Minus />
        </Button>
        <Button
          variant='outline'
          size='icon'
          aria-label='Reset counter'
          onClick={() => updateCount('reset')}
        >
          <RotateCcw />
        </Button>
        <Button className='ml-auto' onClick={() => updateCount('increment')}>
          <Plus />
          Increment
        </Button>
      </HStack>
    </VStack>
  );
};
