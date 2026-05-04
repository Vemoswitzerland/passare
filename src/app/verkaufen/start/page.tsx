import { Container } from '@/components/ui/container';
import { FirmaOnboarding } from './FirmaOnboarding';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Firma inserieren — passare',
  description:
    'In wenigen Schritten zum eigenen Inserat — Handelsregister-Import, anonyme Eckdaten, dann Registrierung.',
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ mode?: string }>;
};

export default async function PreRegStartPage({ searchParams }: Props) {
  const sp = await searchParams;
  // Mode steuert ob der Funnel zur Bewertung (mit Detail-Faktoren + Mail-Versand)
  // oder zum Inserieren (direkt zur Registrierung am Schluss) führt.
  const mode: 'bewerten' | 'inserieren' =
    sp.mode === 'bewerten' ? 'bewerten' : 'inserieren';

  return (
    <main className="min-h-screen bg-cream">
      <header className="border-b border-stone bg-cream/80 backdrop-blur-md sticky top-0 z-30">
        <Container size="wide">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="font-serif text-2xl text-navy tracking-tight">
              passare<span className="text-bronze">.</span>
            </Link>
            <Link
              href="/verkaufen"
              className="inline-flex items-center gap-2 text-body-sm text-quiet hover:text-navy transition-colors"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
              Zurück
            </Link>
          </div>
        </Container>
      </header>

      <Container size="default" className="py-12 md:py-20">
        <FirmaOnboarding mode={mode} />
      </Container>
    </main>
  );
}
