/** @type {import('next').NextConfig} */

// The backend media host (product images live under /uploads on the API host).
// Derived from the API base URL so we never hardcode it in two places.
const apiBase = process.env.API_BASE_URL ?? 'http://localhost:4000/api/v1';
const mediaUrl = new URL(process.env.MEDIA_BASE_URL ?? apiBase.replace(/\/api\/v1\/?$/, ''));

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Serve product images straight from the backend host (no Next image
    // optimizer) so they resolve the same in local dev and in Docker, where
    // the optimizer running inside the container couldn't reach the host.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: mediaUrl.protocol.replace(':', ''),
        hostname: mediaUrl.hostname,
        port: mediaUrl.port || undefined,
        pathname: '/uploads/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
