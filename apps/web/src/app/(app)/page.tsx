import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@workspace/ui/components/button';
import { Center, Container, Heading, HStack, Text, VStack } from '@/components';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Home',
    description:
      'Boilerplate for streamlined development of Turborepo applications with best practices and curated configurations.',
  };
}

export default async function RootPage() {
  return (
    <Center asChild className='flex-1'>
      <section id='hero'>
        <Container>
          <VStack gap={6} className='items-center text-center sm:items-start sm:text-left'>
            <Heading>Turborepo Starter</Heading>
            <Text variant='lead' className='max-w-sm md:max-w-xl'>
              Boilerplate for streamlined development of Turborepo applications with best practices
              and curated configurations.
            </Text>
            <HStack collapse gap={6} className='sm:gap-3'>
              <Button asChild className='h-10 w-full sm:h-9 sm:w-auto'>
                <Link
                  href='https://github.com/craftsamo/turborepo-starter'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  Getting Start
                </Link>
              </Button>
            </HStack>
          </VStack>
        </Container>
      </section>
    </Center>
  );
}
