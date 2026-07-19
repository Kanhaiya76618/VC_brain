import { imageHosts } from './image-hosts.config.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,
  distDir: process.env.DIST_DIR || '.next',
  devIndicators: false,

  typescript: {
    ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    remotePatterns: imageHosts,
    minimumCacheTTL: 60,
    qualities: [75, 85, 100],
  },

  async rewrites() {
    // Vercel rewrites require an absolute URL. Accept a pasted Railway hostname
    // as well as the preferred full https:// URL, while preserving localhost
    // for local development.
    const configuredBackendUrl = process.env.BACKEND_URL?.trim();
    const backendUrl = configuredBackendUrl
      ? (configuredBackendUrl.startsWith('http://') || configuredBackendUrl.startsWith('https://')
        ? configuredBackendUrl
        : `https://${configuredBackendUrl}`)
      : 'http://localhost:4029';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};
export default nextConfig;
