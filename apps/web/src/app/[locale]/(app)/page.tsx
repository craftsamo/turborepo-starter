import type { Metadata } from 'next';
import { ArrowRight, Github } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { Language } from '@workspace/constants';
import { Button } from '@workspace/ui/components/button';
import type { PageProps } from '@workspace/types/web';
import { Container, Heading, HStack, Screen, Section, Text, VStack } from '@/components';
import { Footer } from '@/components/Footer';
import { createLocalizedMetadata } from '@/i18n/metadata';
import { Link } from '@/i18n/navigation';

const stack = ['Next.js 16', 'React 19', 'Turborepo'] as const;

export async function generateMetadata({
  params,
}: PageProps<{ locale: Language }>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return createLocalizedMetadata({
    language: locale,
    pathname: '/',
    title: t('homeTitle'),
    description: t('homeDescription'),
  });
}

export default async function RootPage({ params }: PageProps<{ locale: Language }>) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  const workspaceLayers = [
    { path: 'apps/web', detail: t('layers.web'), index: '01' },
    { path: 'packages/ui', detail: t('layers.ui'), index: '02' },
    { path: 'packages/types', detail: t('layers.types'), index: '03' },
    { path: 'packages/constants', detail: t('layers.constants'), index: '04' },
  ] as const;

  return (
    <Screen smooth hideScrollbar>
      <Section
        id='hero'
        className='relative grow justify-start py-12 sm:pb-20 sm:pt-28 lg:justify-center lg:py-20'
      >
        <div className='pointer-events-none absolute right-0 top-0 size-96 rounded-full bg-primary/10 blur-3xl' />
        <Container className='relative'>
          <div className='grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16'>
            <VStack gap={8}>
              <VStack gap={4}>
                <Text variant='eyebrow' className='font-mono uppercase tracking-widest'>
                  {t('eyebrow')}
                </Text>
                <Heading className='max-w-[12ch]'>{t('heading')}</Heading>
                <Text variant='lead' measure='prose'>
                  {t('introduction')}
                </Text>
              </VStack>

              <HStack gap={2} wrap>
                {stack.map((item) => (
                  <span
                    key={item}
                    className='rounded-full border bg-background/60 px-3 py-1 font-mono text-xs text-muted-foreground backdrop-blur-sm'
                  >
                    {item}
                  </span>
                ))}
              </HStack>

              <HStack collapse gap={3} className='w-full sm:w-auto'>
                <Button asChild size='lg' className='w-full sm:w-auto'>
                  <Link href='/showcase'>
                    {t('exploreShowcase')}
                    <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size='lg' variant='outline' className='w-full sm:w-auto'>
                  <a
                    href='https://github.com/craftsamo/turborepo-starter'
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    <Github />
                    {t('viewOnGitHub')}
                  </a>
                </Button>
              </HStack>
            </VStack>

            <VStack className='gap-0 overflow-hidden rounded-xl border bg-card/80 shadow-sm backdrop-blur-sm'>
              <HStack justify='between' className='w-full border-b px-5 py-4'>
                <HStack gap={2}>
                  <span className='size-2 rounded-full bg-primary' />
                  <span className='font-mono text-xs font-semibold'>workspace/</span>
                </HStack>
                <span className='font-mono text-xs text-muted-foreground'>{t('packageCount')}</span>
              </HStack>

              <VStack asChild className='gap-0'>
                <ul>
                  {workspaceLayers.map((layer) => (
                    <HStack
                      asChild
                      key={layer.path}
                      gap={4}
                      className='group w-full border-b px-5 py-4 last:border-b-0'
                    >
                      <li>
                        <span className='font-mono text-xs text-muted-foreground'>
                          {layer.index}
                        </span>
                        <span className='min-w-0 flex-1 font-mono text-sm font-semibold text-primary'>
                          {layer.path}
                        </span>
                        <span className='hidden text-right text-sm text-muted-foreground sm:block'>
                          {layer.detail}
                        </span>
                      </li>
                    </HStack>
                  ))}
                </ul>
              </VStack>

              <HStack gap={2} className='w-full border-t bg-muted/40 px-5 py-3'>
                <span className='font-mono text-xs text-primary'>$</span>
                <span className='font-mono text-xs text-muted-foreground'>nps dev</span>
                <span className='ml-auto font-mono text-xs text-muted-foreground'>
                  {t('ready')}
                </span>
              </HStack>
            </VStack>
          </div>
        </Container>
      </Section>
      <Footer />
    </Screen>
  );
}
