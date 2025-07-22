import type { NextConfig } from 'next';
import initializeBundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = initializeBundleAnalyzer({
  enabled: process.env.BUNDLE_ANALYZER_ENABLED === 'true',
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@workspace/ui'],

  /**
   * Configures URL rewrites for the application.
   * If the `CLOUD_RUN_API_SERVICE_URL` environment variable is set,
   * incoming requests to `/api/:path*` will be proxied to the specified service URL.
   * Otherwise, no rewrites will be applied.
   *
   * @returns {Promise<Array<{ source: string, destination: string }>>}
   *          An array of rewrite rules or an empty array if no rewrites are applied.
   */
  async rewrites() {
    if (process.env.CLOUD_RUN_API_SERVICE_URL) {
      return [
        {
          source: '/api/:path*',
          destination: `${process.env.CLOUD_RUN_API_SERVICE_URL}/:path*`,
        },
      ];
    }
    return [];
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'ui.shadcn.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['host.docker.internal:3000', 'localhost'],
    },
  },
};

export default withBundleAnalyzer(nextConfig);
