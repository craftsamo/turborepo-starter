import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import { ArrowLeft, Radio } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Container, Heading, HStack, Screen, Section, Text, VStack } from '@/components';
import { StreamResult, StreamResultSkeleton, type StreamingDemoResult } from './_components';

export const metadata: Metadata = {
  title: 'RSC Streaming',
  description: 'See independent React Server Component boundaries stream into the page.',
};

const resolveAfter = (result: StreamingDemoResult) =>
  new Promise<StreamingDemoResult>((resolve) => {
    setTimeout(() => resolve(result), result.delayMs);
  });

export default async function StreamingPage() {
  await connection();

  const stages = [
    {
      index: '01',
      label: 'Primary payload',
      resultPromise: resolveAfter({
        delayMs: 800,
        title: 'Primary payload arrived',
        description: 'This boundary resolves first without waiting for the slower sibling below.',
      }),
    },
    {
      index: '02',
      label: 'Secondary payload',
      resultPromise: resolveAfter({
        delayMs: 1800,
        title: 'Secondary payload arrived',
        description: 'Independent work can finish later while the rest of the page stays usable.',
      }),
    },
  ] as const;

  return (
    <Screen smooth hideScrollbar>
      <Section className='grow justify-center py-12 sm:py-28'>
        <Container>
          <VStack gap={8}>
            <VStack gap={4}>
              <HStack gap={2} className='font-mono text-xs uppercase tracking-widest text-primary'>
                <Radio className='size-4' aria-hidden='true' />
                Live server stream
              </HStack>
              <Heading>Watch the server arrive in stages.</Heading>
              <Text variant='lead' measure='prose'>
                The route shell renders immediately. Each card then unwraps its own server promise
                inside an independent Suspense boundary.
              </Text>
            </VStack>

            <div className='grid gap-4 lg:grid-cols-2'>
              {stages.map((stage) => (
                <VStack
                  asChild
                  key={stage.index}
                  gap={6}
                  className='rounded-xl border bg-card/80 p-5 shadow-sm backdrop-blur-sm sm:p-6'
                >
                  <article>
                    <HStack justify='between' className='w-full'>
                      <span className='font-mono text-xs text-muted-foreground'>{stage.index}</span>
                      <span className='font-mono text-xs text-muted-foreground'>{stage.label}</span>
                    </HStack>
                    <Suspense fallback={<StreamResultSkeleton label={stage.label} />}>
                      <StreamResult resultPromise={stage.resultPromise} />
                    </Suspense>
                  </article>
                </VStack>
              ))}
            </div>

            <div className='rounded-xl border border-dashed bg-muted/30 p-4 sm:p-5'>
              <Text variant='muted' measure='prose'>
                The top progress bar covers navigation to this route. These skeletons cover server
                work that continues streaming after the route shell appears.
              </Text>
            </div>

            <Button asChild variant='outline' className='w-fit'>
              <Link href='/showcase'>
                <ArrowLeft />
                Back to showcase
              </Link>
            </Button>
          </VStack>
        </Container>
      </Section>
    </Screen>
  );
}
