import type { Metadata } from 'next';
import { Cormorant_Garamond, Outfit } from 'next/font/google';
import './globals.css';

const serif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-serif',
  display: 'swap',
});

const sans = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'passare.ch — Schweizer Firmen-Verkaufsportal',
  description:
    'Passare. Der vertrauensvolle Übergang. Kaufen, verkaufen, bewerten — Schweizer KMU. Vierpassare.ch — Schweizer Firmen-Verkaufsportal.',
  metadataBase: new URL('https://passare.ch'),
  openGraph: {
    title: 'passare.ch',
    description: 'Schweizer Firmen-Verkaufsportal',
    type: 'website',
    locale: 'de_CH',
  },
  robots: { index: false, follow: false }, // Beta: noindex
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de-CH" className={`${serif.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
