import Link from 'next/link';
import { Container, Section } from '@/components/ui/container';

export const metadata = {
  title: 'AGB — passare',
  robots: { index: false, follow: false },
};

export default function AGBPage() {
  return (
    <main className="min-h-screen bg-cream">
      <Section className="py-16 md:py-24">
        <Container>
          <div className="max-w-prose">
            <p className="overline mb-5 text-bronze-ink">Rechtliches</p>
            <h1 className="font-serif text-display-md text-navy font-light mb-8">
              Allgemeine Geschäftsbedingungen<span className="text-bronze">.</span>
            </h1>
            <div className="space-y-6 text-body text-muted leading-relaxed">
              <p>
                Die AGB regeln das Vertragsverhältnis zwischen passare und ihren
                Nutzern (Verkäufer, Käufer, Broker).
              </p>
              <p>
                Die vollständigen Allgemeinen Geschäftsbedingungen werden zur
                öffentlichen Eröffnung der Plattform veröffentlicht. Während der
                Beta-Phase gelten unsere vorläufigen Nutzungsbedingungen, die
                im Onboarding bestätigt werden.
              </p>
              <p>
                Bei Fragen erreichen Sie uns unter <a href="mailto:info@passare.ch" className="text-navy hover:text-bronze-ink underline">info@passare.ch</a>.
              </p>
              <p className="pt-6">
                <Link href="/" className="text-navy hover:text-bronze-ink">← Zurück zur Startseite</Link>
              </p>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
