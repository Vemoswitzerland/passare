import Link from 'next/link';
import { Mail, MapPin } from 'lucide-react';
import { Container, Section } from '@/components/ui/container';

export const metadata = {
  title: 'Kontakt — passare',
  robots: { index: false, follow: false },
};

export default function KontaktPage() {
  return (
    <main className="min-h-screen bg-cream">
      <Section className="py-16 md:py-24">
        <Container>
          <div className="max-w-prose">
            <p className="overline mb-5 text-bronze-ink">Wir helfen gern</p>
            <h1 className="font-serif text-display-md text-navy font-light mb-8">
              Kontakt<span className="text-bronze">.</span>
            </h1>
            <div className="space-y-8 text-body text-muted leading-relaxed">
              <p>
                Du hast Fragen zur Plattform, brauchst Hilfe beim Inserat oder
                möchtest dich austauschen? Schreib uns — wir antworten in der
                Regel innerhalb eines Werktags.
              </p>

              <div className="bg-paper border border-stone rounded-card p-6 md:p-8">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-10 h-10 rounded-soft bg-bronze/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-bronze" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="overline text-bronze-ink mb-1">E-Mail</p>
                    <a
                      href="mailto:info@passare.ch"
                      className="text-body-lg text-navy hover:text-bronze-ink font-medium"
                    >
                      info@passare.ch
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-soft bg-bronze/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-bronze" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="overline text-bronze-ink mb-1">Sitz</p>
                    <p className="text-body text-navy">Schweiz</p>
                  </div>
                </div>
              </div>

              <p className="pt-2">
                <Link href="/" className="text-navy hover:text-bronze-ink">← Zurück zur Startseite</Link>
              </p>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
