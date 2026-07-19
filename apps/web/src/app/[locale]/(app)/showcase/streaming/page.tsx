import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { connection } from 'next/server';
import { ArrowLeft, Radio } from 'lucide-react';
import type { Language } from '@workspace/constants';
import { Button } from '@workspace/ui/components/button';
import type { PageProps } from '@workspace/types/web';
import { Container, Heading, HStack, Screen, Section, Text, VStack } from '@/components';
import { createLocalizedMetadata } from '@/i18n/metadata';
import { Link } from '@/i18n/navigation';
import { StreamResult, StreamResultSkeleton, type StreamingDemoResult } from './_components';

export async function generateMetadata({
  params,
}: PageProps<{ locale: Language }>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return createLocalizedMetadata({
    language: locale,
    pathname: '/showcase/streaming',
    title: t('streamingTitle'),
    description: t('streamingDescription'),
  });
}

const resolveAfter = (result: StreamingDemoResult) =>
  new Promise<StreamingDemoResult>((resolve) => {
    setTimeout(() => resolve(result), result.delayMs);
  });

export default async function StreamingPage({ params }: PageProps<{ locale: Language }>) {
  await connection();
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'streaming' });

  const stages = [
    {
      index: '01',
      label: t('primaryLabel'),
      resultPromise: resolveAfter({
        delayMs: 800,
        title: t('primaryTitle'),
        description: t('primaryDescription'),
      }),
    },
    {
      index: '02',
      label: t('secondaryLabel'),
      resultPromise: resolveAfter({
        delayMs: 1800,
        title: t('secondaryTitle'),
        description: t('secondaryDescription'),
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
                {t('eyebrow')}
              </HStack>
              <Heading>{t('heading')}</Heading>
              <Text variant='lead' measure='prose'>
                {t('introduction')}
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
                    <Suspense
                      fallback={<StreamResultSkeleton label={stage.label} locale={locale} />}
                    >
                      <StreamResult locale={locale} resultPromise={stage.resultPromise} />
                    </Suspense>
                  </article>
                </VStack>
              ))}
            </div>

            <div className='rounded-xl border border-dashed bg-muted/30 p-4 sm:p-5'>
              <Text variant='muted' measure='prose'>
                {t('skeletonDescription')}
              </Text>
            </div>

            <Button asChild variant='outline' className='w-fit'>
              <Link href='/showcase'>
                <ArrowLeft />
                {t('backToShowcase')}
              </Link>
            </Button>
          </VStack>
        </Container>
      </Section>
    </Screen>
  );
}
