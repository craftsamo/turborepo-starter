import type { MetadataRoute } from 'next';

const baseUrl = process.env.WEB_BASE_URL ?? 'http://localhost';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
  ];
}
