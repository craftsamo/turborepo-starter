import type { Metadata } from 'next';
import type { Language } from '@workspace/constants';
import { languages } from '@workspace/constants';

const configuredBaseUrl = process.env.BASE_URL;

export const baseUrl =
  configuredBaseUrl && URL.canParse(configuredBaseUrl) ? configuredBaseUrl : 'http://localhost';

export const publicPaths = ['/', '/showcase', '/showcase/streaming'] as const;

export function getLocalizedPath(language: Language, pathname: string) {
  return `/${language}${pathname === '/' ? '' : pathname}`;
}

interface LocalizedMetadataOptions {
  description: string;
  language: Language;
  pathname: string;
  title: string;
}

export function createLocalizedMetadata({
  description,
  language,
  pathname,
  title,
}: LocalizedMetadataOptions): Metadata {
  const canonical = getLocalizedPath(language, pathname);
  const openGraphImage = new URL('/image/opengraph-image.jpg', baseUrl).toString();
  const twitterImage = new URL('/image/twitter-image.jpg', baseUrl).toString();
  const languageAlternates = Object.fromEntries(
    languages.map((supportedLanguage) => [
      supportedLanguage,
      getLocalizedPath(supportedLanguage, pathname),
    ]),
  );

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        ...languageAlternates,
        'x-default': getLocalizedPath('en', pathname),
      },
    },
    openGraph: {
      type: 'website',
      siteName: 'Turborepo Starter',
      title,
      description,
      url: canonical,
      locale: language === 'ja' ? 'ja_JP' : 'en_US',
      alternateLocale: language === 'ja' ? ['en_US'] : ['ja_JP'],
      images: [
        {
          url: openGraphImage,
          width: 1280,
          height: 720,
          alt: 'Turborepo Starter',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [twitterImage],
    },
  };
}
