import type { Metadata } from 'next';
import { ArrowDown, ArrowRight, Blocks, Layers3, Zap } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { Language } from '@workspace/constants';
import { Button } from '@workspace/ui/components/button';
import type { PageProps } from '@workspace/types/web';
import { Container, Heading, HStack, Screen, Section, Text, VStack } from '@/components';
import { createLocalizedMetadata } from '@/i18n/metadata';
import { Link } from '@/i18n/navigation';
import { StateFeedbackDemo, ThemeLayoutDemo } from './_components';

export async function generateMetadata({
  params,
}: PageProps<{ locale: Language }>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return createLocalizedMetadata({
    language: locale,
    pathname: '/showcase',
    title: t('showcaseTitle'),
    description: t('showcaseDescription'),
  });
}

export default async function ShowcasePage({ params }: PageProps<{ locale: Language }>) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'showcase' });
  const foundations = [
    { label: t('foundationState'), value: 'Redux Toolkit', icon: Blocks },
    { label: t('foundationFeedback'), value: 'Sonner Toast', icon: Zap },
    { label: t('foundationLayout'), value: 'Flow / Full / Snap', icon: Layers3 },
  ] as const;

  return (
    <Screen mode='snap' smooth hideScrollbar>
      <Section id='overview' className='justify-center py-8 sm:py-24'>
        <Container>
          <VStack gap={8} className='gap-6 sm:gap-8'>
            <VStack gap={4}>
              <Text variant='eyebrow' className='font-mono uppercase tracking-widest'>
                {t('overviewEyebrow')}
              </Text>
              <Heading>{t('overviewHeading')}</Heading>
              <Text variant='lead' measure='prose'>
                {t('overviewDescription')}
              </Text>
            </VStack>

            <div className='grid gap-3 sm:grid-cols-3'>
              {foundations.map(({ label, value, icon: Icon }, index) => (
                <VStack
                  key={label}
                  gap={6}
                  className='gap-3 rounded-xl border bg-card p-4 shadow-sm sm:gap-6 sm:p-5'
                >
                  <HStack justify='between' className='w-full'>
                    <span className='font-mono text-xs text-muted-foreground'>0{index + 1}</span>
                    <Icon className='size-4 text-primary' aria-hidden='true' />
                  </HStack>
                  <VStack gap={1}>
                    <span className='text-sm text-muted-foreground'>{label}</span>
                    <span className='font-semibold'>{value}</span>
                  </VStack>
                </VStack>
              ))}
            </div>

            <HStack collapse gap={3} className='w-full sm:w-auto'>
              <Button asChild variant='outline' className='w-full sm:w-auto'>
                <Link href='#state'>
                  {t('startExploring')}
                  <ArrowDown />
                </Link>
              </Button>
              <Button asChild className='w-full sm:w-auto'>
                <Link href='/showcase/streaming' prefetch={false}>
                  {t('openStreaming')}
                  <ArrowRight />
                </Link>
              </Button>
            </HStack>
          </VStack>
        </Container>
      </Section>

      <Section id='state' className='justify-center py-8 sm:py-24'>
        <Container>
          <div className='grid items-center gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16'>
            <VStack gap={4}>
              <Text variant='eyebrow' className='font-mono uppercase tracking-widest'>
                {t('stateEyebrow')}
              </Text>
              <Heading as='h2' level={2}>
                {t('stateHeading')}
              </Heading>
              <Text variant='muted' measure='prose'>
                {t('stateDescription')}
              </Text>
            </VStack>
            <StateFeedbackDemo />
          </div>
        </Container>
      </Section>

      <Section id='system' className='justify-center py-8 sm:py-24'>
        <Container>
          <VStack gap={8} className='gap-6 sm:gap-8'>
            <VStack gap={4}>
              <Text variant='eyebrow' className='font-mono uppercase tracking-widest'>
                {t('themeEyebrow')}
              </Text>
              <Heading as='h2' level={2}>
                {t('themeHeading')}
              </Heading>
              <Text variant='muted' measure='prose'>
                {t('themeDescription')}
              </Text>
            </VStack>
            <ThemeLayoutDemo />
          </VStack>
        </Container>
      </Section>
    </Screen>
  );
}
