import type { Metadata } from 'next';
import { Fraunces } from 'next/font/google';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  axes: ['opsz', 'SOFT', 'WONK'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'passare — Die Schweizer Plattform für KMU-Nachfolge',
  description:
    'Firma selbst inserieren und Käufer direkt kontaktieren. Fester Paketpreis ab CHF 290, anonymes Profil und NDA-Gate. Die Schweizer Self-Service-Plattform für KMU-Nachfolge.',
  metadataBase: new URL('https://passare.ch'),
  openGraph: {
    title: 'passare',
    description: 'Die Schweizer Nachfolge-Plattform',
    type: 'website',
    locale: 'de_CH',
  },
  robots: { index: false, follow: false }, // Beta: noindex
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="de-CH"
      className={`${fraunces.variable} ${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
