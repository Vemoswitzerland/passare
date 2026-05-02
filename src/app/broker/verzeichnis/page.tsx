import Link from 'next/link';
import { Building2, MapPin, ArrowRight, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Container, Section } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { SiteHeader, SiteFooter } from '../../page';

export const metadata = {
  title: 'Broker-Verzeichnis — passare',
  description: 'Alle aktiven M&A-Broker und Berater auf passare.',
  robots: { index: false, follow: false },
};

export default async function BrokerVerzeichnisPage() {
  const supabase = await createClient();

  const { data: brokers } = await supabase
    .from('broker_profiles_public')
    .select('*')
    .order('active_mandate_count', { ascending: false });

  return (
    <main className="min-h-screen flex flex-col bg-cream">
      <SiteHeader />

      <Section className="pt-20 md:pt-28 pb-16">
        <Container>
          <Reveal>
            <div className="max-w-prose mb-12">
              <p className="overline mb-5 text-bronze-ink">Broker-Verzeichnis</p>
              <h1 className="font-serif text-display-lg text-navy font-light tracking-[-0.025em]">
                Unsere Broker.
              </h1>
              <p className="text-body-lg text-muted mt-4 leading-relaxed">
                Professionelle M&A-Berater die auf passare aktiv sind. Jeder Broker ist verifiziert
                und verwaltet aktive Verkaufsmandate.
              </p>
            </div>
          </Reveal>

          {(!brokers || brokers.length === 0) ? (
            <div className="rounded-card bg-paper border border-stone p-10 text-center">
              <Building2 className="w-10 h-10 text-stone mx-auto mb-4" strokeWidth={1.5} />
              <h2 className="font-serif text-head-md text-navy mb-2">Noch keine Broker</h2>
              <p className="text-body-sm text-muted max-w-sm mx-auto">
                Sobald Broker auf passare aktiv werden, erscheinen sie hier.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {brokers.map((b: any) => (
                <Reveal key={b.id} delay={0.05}>
                  <Link
                    href={`/broker/${b.slug}`}
                    className="group flex flex-col rounded-card border border-stone bg-paper p-6 hover:border-bronze/40 hover:shadow-card hover:-translate-y-px transition-all h-full"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      {b.logo_url ? (
                        <img
                          src={b.logo_url}
                          alt={b.agentur_name}
                          className="w-12 h-12 rounded-soft object-cover border border-stone flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-soft bg-navy/10 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-6 h-6 text-navy" strokeWidth={1.5} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-serif text-head-sm text-navy truncate">{b.agentur_name}</p>
                        {b.kanton && (
                          <p className="text-caption text-muted inline-flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" strokeWidth={1.5} />
                            {b.kanton}
                          </p>
                        )}
                      </div>
                    </div>

                    {b.bio && (
                      <p className="text-body-sm text-muted line-clamp-2 mb-4 flex-1">
                        {b.bio}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-stone/60">
                      <span className="text-caption text-quiet inline-flex items-center gap-1">
                        <FileText className="w-3 h-3" strokeWidth={1.5} />
                        {b.active_mandate_count} aktive Mandate
                      </span>
                      <span className="text-caption text-bronze-ink inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                        Profil <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </Container>
      </Section>

      <SiteFooter />
    </main>
  );
}
