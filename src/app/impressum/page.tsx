import Link from 'next/link';
import { Container, Section } from '@/components/ui/container';

export const metadata = {
  title: 'Impressum — passare',
  robots: { index: false, follow: false },
};

export default function ImpressumPage() {
  return (
    <main className="min-h-screen bg-cream">
      <Section className="py-16 md:py-24">
        <Container>
          <div className="max-w-prose">
            <p className="overline mb-5 text-bronze-ink">Rechtliches</p>
            <h1 className="font-serif text-display-md text-navy font-light mb-8">
              Impressum<span className="text-bronze">.</span>
            </h1>
            <div className="space-y-6 text-body text-muted leading-relaxed">
              <p>
                Diese Seite wird betrieben von <strong className="text-navy">passare</strong> —
                der Schweizer Self-Service-Plattform für die Nachfolge von KMU.
              </p>
              <p>
                Vollständiges Impressum folgt zur öffentlichen Eröffnung der Plattform.
                Während der Beta-Phase gelten die Angaben in unseren Nutzungsbedingungen.
              </p>
              <p>
                Kontakt: <a href="mailto:info@passare.ch" className="text-navy hover:text-bronze-ink underline">info@passare.ch</a>
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
