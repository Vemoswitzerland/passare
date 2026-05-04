import type { MetadataRoute } from 'next';

/**
 * robots.txt — während Beta noindex auf praktisch alles.
 *
 * Ausnahme: `/status` (interner Live-Stand mit PIN) und `/beta`
 * (Public-Eingang mit Beta-Code). Beide MÜSSEN crawlbar bleiben, damit
 * Vercel-Healthchecks und Bot-Status-Pings durchkommen — das ist
 * Memory-Vorgabe `feedback_no_preview_server` / `project_passare_*`.
 *
 * Reihenfolge ist signifikant: `allow` muss VOR `disallow` stehen,
 * sonst wirkt das Disallow auch auf die Allow-Pfade.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/status', '/beta'],
        disallow: '/',
      },
    ],
  };
}
