import Link from 'next/link';
import { Container, Section } from '@/components/ui/container';

export const metadata = {
  title: 'Datenschutz — passare',
  robots: { index: false, follow: false },
};

export default function DatenschutzPage() {
  return (
    <main className="min-h-screen bg-cream">
      <Section className="py-16 md:py-24">
        <Container>
          <div className="max-w-prose">
            <p className="overline mb-5 text-bronze-ink">Rechtliches</p>
            <h1 className="font-serif text-display-md text-navy font-light mb-8">
              Datenschutz<span className="text-bronze">.</span>
            </h1>
            <div className="space-y-6 text-body text-muted leading-relaxed">
              <p>
                passare nimmt den Schutz Ihrer personenbezogenen Daten ernst.
                Wir verarbeiten Daten gemäss Schweizer Datenschutzgesetz (DSG)
                und der DSGVO.
              </p>
              <p>
                Die vollständige Datenschutzerklärung wird zur öffentlichen Eröffnung
                der Plattform veröffentlicht. Während der Beta-Phase gelten unsere
                Standard-Hinweise zur Daten-Verarbeitung.
              </p>
              <p>
                Bei Fragen wenden Sie sich an <a href="mailto:info@passare.ch" className="text-navy hover:text-bronze-ink underline">info@passare.ch</a>.
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
