import { CircleCheck } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { Language } from '@workspace/constants';
import { HStack, Text, VStack } from '@/components';

export interface StreamingDemoResult {
  delayMs: number;
  description: string;
  title: string;
}

interface StreamResultProps {
  locale: Language;
  resultPromise: Promise<StreamingDemoResult>;
}

export const StreamResult = async ({ locale, resultPromise }: StreamResultProps) => {
  const result = await resultPromise;
  const t = await getTranslations({ locale, namespace: 'streaming' });

  return (
    <VStack gap={4} className='min-h-36 justify-between border-t pt-5'>
      <VStack gap={2}>
        <HeadingRow title={result.title} />
        <Text variant='muted'>{result.description}</Text>
      </VStack>
      <span className='w-fit rounded-full bg-primary/10 px-3 py-1 font-mono text-xs font-semibold text-primary'>
        {t('resolvedAfter', { delay: result.delayMs })}
      </span>
    </VStack>
  );
};

const HeadingRow = ({ title }: Pick<StreamingDemoResult, 'title'>) => (
  <HStack gap={2}>
    <CircleCheck className='size-4 text-primary' aria-hidden='true' />
    <h2 className='font-semibold'>{title}</h2>
  </HStack>
);
