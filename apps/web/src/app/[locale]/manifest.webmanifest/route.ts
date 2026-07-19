import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { NextResponse } from 'next/server';
import { routing } from '@/i18n/routing';

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale: requestedLocale } = await params;

  if (!hasLocale(routing.locales, requestedLocale)) {
    return new NextResponse(null, { status: 404 });
  }

  const locale = requestedLocale;
  const t = await getTranslations({ locale, namespace: 'manifest' });

  return NextResponse.json(
    {
      name: t('name'),
      short_name: t('shortName'),
      description: t('description'),
      start_url: `/${locale}`,
      lang: locale,
      display: 'standalone',
      background_color: '#fafafa',
      theme_color: '#09090b',
      icons: [
        {
          src: '/image/icon-192.jpg',
          sizes: '192x192',
          type: 'image/jpeg',
        },
        {
          src: '/image/icon-512.jpg',
          sizes: '512x512',
          type: 'image/jpeg',
        },
        {
          src: '/image/icon-maskable.jpg',
          sizes: '512x512',
          type: 'image/jpeg',
          purpose: 'maskable',
        },
      ],
    },
    {
      headers: {
        'Content-Type': 'application/manifest+json',
      },
    },
  );
}
