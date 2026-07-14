import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowDown, Blocks, Layers3, Zap } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Container, Heading, HStack, Screen, Section, Text, VStack } from '@/components';
import { StateFeedbackDemo, ThemeLayoutDemo } from './_components';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Showcase',
    description: 'Explore the state, feedback, theme, and layout foundations in this starter.',
  };
}

const foundations = [
  { label: 'State', value: 'Redux Toolkit', icon: Blocks },
  { label: 'Feedback', value: 'Sonner Toast', icon: Zap },
  { label: 'Layout', value: 'Flow / Full / Snap', icon: Layers3 },
] as const;

export default async function ShowcasePage() {
  return (
    <Screen mode='snap' smooth hideScrollbar>
      <Section id='overview' className='justify-center py-8 sm:py-24'>
        <Container>
          <VStack gap={8} className='gap-6 sm:gap-8'>
            <VStack gap={4}>
              <Text variant='eyebrow' className='font-mono uppercase tracking-widest'>
                Interactive showcase / 01
              </Text>
              <Heading>Built to be touched.</Heading>
              <Text variant='lead' measure='prose'>
                A working tour of the foundations already wired into this starter. Change state,
                trigger feedback, switch themes, and move through the layout system.
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

            <Button asChild variant='outline' className='w-fit'>
              <Link href='#state'>
                Start exploring
                <ArrowDown />
              </Link>
            </Button>
          </VStack>
        </Container>
      </Section>

      <Section id='state' className='justify-center py-8 sm:py-24'>
        <Container>
          <div className='grid items-center gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16'>
            <VStack gap={4}>
              <Text variant='eyebrow' className='font-mono uppercase tracking-widest'>
                State &amp; feedback / 02
              </Text>
              <Heading as='h2' level={2}>
                State you can see.
              </Heading>
              <Text variant='muted' measure='prose'>
                Every control dispatches through the typed Redux hooks. Sonner confirms the same
                action without blocking the flow.
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
                Theme &amp; layout / 03
              </Text>
              <Heading as='h2' level={2}>
                One system, multiple modes.
              </Heading>
              <Text variant='muted' measure='prose'>
                Theme tokens update every surface together. This page itself uses the snap mode,
                while the same primitives also support natural and full-height flows.
              </Text>
            </VStack>
            <ThemeLayoutDemo />
          </VStack>
        </Container>
      </Section>
    </Screen>
  );
}
