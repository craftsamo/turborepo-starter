import path from 'path';
import type { NextConfig } from 'next';
import initializeBundleAnalyzer from '@next/bundle-analyzer';
import createNextIntlPlugin from 'next-intl/plugin';

const withBundleAnalyzer = initializeBundleAnalyzer({
  enabled: process.env.BUNDLE_ANALYZER_ENABLED === 'true',
});

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// The Docker build sets this to emit `.next/standalone`: a minimal server plus
// only the node_modules files it traces, so the image need not ship the whole
// workspace install. Other builds keep the default output for `next start`.
const standaloneOutput = process.env.STANDALONE_OUTPUT_ENABLED === 'true';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@workspace/ui'],

  ...(standaloneOutput && {
    output: 'standalone',
    // Trace from the monorepo root so workspace packages are included.
    outputFileTracingRoot: path.join(__dirname, '../../'),
  }),

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
    globalNotFound: true,
    serverActions: {
      allowedOrigins: ['host.docker.internal:3000', 'localhost'],
    },
  },
};

export default withBundleAnalyzer(withNextIntl(nextConfig));
