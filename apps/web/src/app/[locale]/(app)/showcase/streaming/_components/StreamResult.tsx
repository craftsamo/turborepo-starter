import { CircleCheck } from 'lucide-react';
import { HStack, Text, VStack } from '@/components';

export interface StreamingDemoResult {
  delayMs: number;
  description: string;
  title: string;
}

interface StreamResultProps {
  resultPromise: Promise<StreamingDemoResult>;
}

export const StreamResult = async ({ resultPromise }: StreamResultProps) => {
  const result = await resultPromise;

  return (
    <VStack gap={4} className='min-h-36 justify-between border-t pt-5'>
      <VStack gap={2}>
        <HeadingRow title={result.title} />
        <Text variant='muted'>{result.description}</Text>
      </VStack>
      <span className='w-fit rounded-full bg-primary/10 px-3 py-1 font-mono text-xs font-semibold text-primary'>
        resolved after {result.delayMs.toLocaleString('en-US')} ms
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
