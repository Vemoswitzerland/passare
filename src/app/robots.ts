import type { MetadataRoute } from 'next';

/**
 * robots.txt — während Beta noindex auf ALLES.
 * Wird umgestellt sobald Public Launch.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', disallow: '/' }],
  };
}
