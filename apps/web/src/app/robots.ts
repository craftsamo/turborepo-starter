import type { MetadataRoute } from 'next';

const baseUrl = process.env.WEB_BASE_URL ?? 'http://localhost';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
