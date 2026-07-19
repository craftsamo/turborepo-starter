import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { Button } from '@workspace/ui/components/button';
import { Center, Container, Heading, HStack, Text, VStack } from '@/components';
import { Link } from '@/i18n/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');

  return {
    title: t('notFoundTitle'),
    description: t('notFoundDescription'),
    robots: { index: false, follow: false },
  };
}

export default async function NotFound() {
  const locale = await getLocale();
  const t = await getTranslations('notFound');

  return (
    <Center asChild min='screen'>
      <main>
        <Container>
          <VStack gap={6} align='center' className='text-center'>
            <Text variant='eyebrow'>{t('eyebrow')}</Text>
            <Heading>{t('heading')}</Heading>
            <Text variant='lead' measure='prose'>
              {t('description')}
            </Text>
            <HStack wrap justify='center'>
              <Button asChild>
                <Link href='/' locale={locale} aria-label={t('backHome')}>
                  <ArrowLeft className='size-4' />
                  {t('backHome')}
                </Link>
              </Button>
            </HStack>
          </VStack>
        </Container>
      </main>
    </Center>
  );
}
