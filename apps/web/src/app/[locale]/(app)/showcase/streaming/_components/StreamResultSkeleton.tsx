import { getTranslations } from 'next-intl/server';
import type { Language } from '@workspace/constants';

interface StreamResultSkeletonProps {
  label: string;
  locale: Language;
}

export const StreamResultSkeleton = async ({ label, locale }: StreamResultSkeletonProps) => {
  const t = await getTranslations({ locale, namespace: 'streaming' });

  return (
    <div
      role='status'
      aria-busy='true'
      aria-label={t('isStreaming', { label })}
      className='min-h-36 border-t pt-5'
    >
      <div className='animate-pulse space-y-4 motion-reduce:animate-none'>
        <div className='h-5 w-2/3 rounded bg-muted' />
        <div className='space-y-2'>
          <div className='h-4 w-full rounded bg-muted' />
          <div className='h-4 w-4/5 rounded bg-muted' />
        </div>
        <div className='h-6 w-36 rounded-full bg-primary/10' />
      </div>
      <span className='sr-only'>{t('streamingLabel', { label })}</span>
    </div>
  );
};
