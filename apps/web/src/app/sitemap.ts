import type { MetadataRoute } from 'next';
import { languages } from '@workspace/constants';
import { baseUrl, getLocalizedPath, publicPaths } from '@/i18n/metadata';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return publicPaths.flatMap((pathname) =>
    languages.map((language) => ({
      url: new URL(getLocalizedPath(language, pathname), baseUrl).toString(),
      lastModified,
      changeFrequency: 'yearly' as const,
      priority: pathname === '/' ? 1 : 0.8,
      alternates: {
        languages: Object.fromEntries(
          languages.map((alternateLanguage) => [
            alternateLanguage,
            new URL(getLocalizedPath(alternateLanguage, pathname), baseUrl).toString(),
          ]),
        ),
      },
    })),
  );
}
