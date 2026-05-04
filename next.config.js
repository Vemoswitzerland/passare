/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: '10mb' },
  },
  // Während der Beta: noindex auf ALLEM (HTML + Bilder + PDFs + JSON).
  // Wird auf 'index, follow' umgestellt sobald wir public-launchen.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive, nosnippet' },
        ],
      },
    ];
  },
  // Cyrill 02.05.2026 (Diego konnte sich nicht via Google registrieren, weil
  // er auf www.passare.ch landete und der OAuth-redirect_uri dadurch
  // www.passare.ch wurde — Google Cloud Console hat aber nur passare.ch
  // registriert). Lösung: alle www-Requests permanent auf canonical
  // passare.ch umleiten. Damit landet niemand mehr auf www., und der
  // OAuth-Mismatch kann nicht mehr auftreten.
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.passare.ch' }],
        destination: 'https://passare.ch/:path*',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
