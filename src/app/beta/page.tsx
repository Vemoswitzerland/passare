import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Divider } from '@/components/ui/divider';
import { BetaForm } from './BetaForm';

export const metadata = {
  title: 'Beta-Zugang — passare',
  robots: { index: false, follow: false },
};

export default function BetaPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b border-stone">
        <Container>
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link href="/" className="font-serif text-2xl text-navy tracking-tight">
              passare<span className="text-bronze">.</span>
            </Link>
            <span className="overline text-quiet">Geschlossener Beta-Zugang</span>
          </div>
        </Container>
      </header>

      <section className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-md animate-fade-up">
          <div className="text-center mb-12">
            <p className="overline text-bronze mb-5">Einladung erforderlich</p>
            <h1 className="font-serif text-display-sm text-navy font-light mb-5">
              Willkommen bei passare.
            </h1>
            <p className="text-body text-muted leading-relaxed max-w-sm mx-auto">
              Wir öffnen die Plattform im Herbst 2026. Bis dahin bitten wir um Ihren
              persönlichen Zugangscode.
            </p>
          </div>

          <div className="bg-paper border border-stone rounded-card p-8 md:p-10">
            <BetaForm />
          </div>

          <Divider className="my-10" />

          <p className="text-center text-caption text-quiet leading-relaxed">
            Noch keinen Zugang?&nbsp;
            <a
              className="editorial text-navy"
              href="mailto:beta@passare.ch?subject=Beta-Anfrage%20passare.ch"
            >
              beta@passare.ch
            </a>
          </p>
        </div>
      </section>

      <footer className="border-t border-stone py-6">
        <Container>
          <p className="text-center text-caption text-quiet">
            passare &mdash; «Made in Switzerland»
          </p>
        </Container>
      </footer>
    </main>
  );
}
