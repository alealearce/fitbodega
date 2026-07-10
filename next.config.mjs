import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure the social-card logo PNGs are bundled into the serverless function
  // (the image route reads them from public/social via fs at render time).
  experimental: {
    outputFileTracingIncludes: {
      '/api/social/image': ['./public/social/**'],
    },
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
      { hostname: 'fitbodega.com' },
      { protocol: 'https', hostname: '**' },
    ],
  },

  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.fitbodega.com' }],
        destination: 'https://fitbodega.com/:path*',
        permanent: true,
      },

      // ── WordPress/WooCommerce-era URLs (old supplement store) ────────────
      // Blog posts already lived at root-level /:slug and keep serving there.
      // Store/category shapes consolidate into the closest directory hub.
      { source: '/shop',              destination: '/health-food-stores', permanent: true },
      { source: '/shop/:path*',       destination: '/health-food-stores', permanent: true },
      { source: '/product/:path*',    destination: '/health-food-stores', permanent: true },
      { source: '/product-category/:path*', destination: '/health-food-stores', permanent: true },
      { source: '/category/:path*',   destination: '/community', permanent: true },
      { source: '/tag/:path*',        destination: '/community', permanent: true },
      { source: '/author/:path*',     destination: '/community', permanent: true },
      { source: '/blog',              destination: '/community', permanent: true },
      { source: '/blogs/:path*',      destination: '/community', permanent: true },
    ];
  },

  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://*.vercel-insights.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' https: data: blob:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.vercel-insights.com",
      "frame-src 'none'",
      "worker-src 'self' blob:",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
