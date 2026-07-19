import { Github } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Container } from '../Container';
import { HStack } from '../Stack';

/**
 * Minimal app footer. Place it explicitly inside the page's `Screen`.
 */
export const Footer = async () => {
  const t = await getTranslations('footer');

  return (
    <footer className='shrink-0 snap-end border-t py-3'>
      <Container>
        <HStack gap={2} justify='between' className='text-sm text-muted-foreground'>
          <p>{t('copyright', { year: new Date().getFullYear() })}</p>
          <a
            href='https://github.com/craftsamo/turborepo-starter'
            target='_blank'
            rel='noopener noreferrer'
            aria-label={t('github')}
            className='transition-colors hover:text-foreground'
          >
            <Github className='size-5' />
          </a>
        </HStack>
      </Container>
    </footer>
  );
};
