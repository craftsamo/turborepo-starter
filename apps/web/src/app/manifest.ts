import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Turborepo Starter',
    short_name: 'Turborepo',
    description:
      'Boilerplate for streamlined development of Turborepo applications with best practices and curated configurations.',
    start_url: '/',
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
  };
}
