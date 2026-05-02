import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Building2, Globe, Phone, MapPin, FileText, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Container, Section } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { SiteHeader, SiteFooter } from '../../page';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: bp } = await supabase
    .from('broker_profiles')
    .select('agentur_name')
    .eq('slug', slug)
    .eq('subscription_status', 'active')
    .maybeSingle();

  if (!bp) return { title: 'Broker nicht gefunden — passare' };
  return {
    title: `${bp.agentur_name} — Broker auf passare`,
    robots: { index: false, follow: false },
  };
}

export default async function BrokerProfilPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: bp } = await supabase
    .from('broker_profiles')
    .select('*')
    .eq('slug', slug)
    .eq('subscription_status', 'active')
    .maybeSingle();

  if (!bp || bp.suspended_at) notFound();

  const { data: profile } = await supabase
    .from('profiles')
    .select('kanton, full_name')
    .eq('id', bp.id)
    .maybeSingle();

  // Aktive Mandate des Brokers
  const { data: mandate } = await supabase
    .from('inserate')
    .select('id, titel, branche, kanton, cover_url, public_id')
    .eq('broker_id', bp.id)
    .eq('status', 'live')
    .order('published_at', { ascending: false });

  return (
    <main className="min-h-screen flex flex-col bg-cream">
      <SiteHeader />

      <Section className="pt-20 md:pt-28 pb-12">
        <Container>
          <div className="max-w-3xl">
            <div className="flex items-start gap-5 mb-8">
              {bp.logo_url ? (
                <img
                  src={bp.logo_url}
                  alt={bp.agentur_name}
                  className="w-16 h-16 rounded-card object-cover border border-stone flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-card bg-navy/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-8 h-8 text-navy" strokeWidth={1.5} />
                </div>
              )}
              <div>
                <h1 className="font-serif text-display-sm text-navy font-light tracking-tight">
                  {bp.agentur_name}
                </h1>
                {profile?.kanton && (
                  <p className="text-body text-muted mt-1 inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />
                    Kanton {profile.kanton}
                  </p>
                )}
              </div>
            </div>

            {bp.bio && (
              <p className="text-body text-ink leading-relaxed mb-8 whitespace-pre-line">
                {bp.bio}
              </p>
            )}

            <div className="flex flex-wrap gap-4 mb-12">
              {bp.website && (
                <a
                  href={bp.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-body-sm text-bronze-ink hover:text-navy transition-colors"
                >
                  <Globe className="w-4 h-4" strokeWidth={1.5} />
                  Website
                </a>
              )}
              {bp.telefon && (
                <a
                  href={`tel:${bp.telefon}`}
                  className="inline-flex items-center gap-1.5 text-body-sm text-bronze-ink hover:text-navy transition-colors"
                >
                  <Phone className="w-4 h-4" strokeWidth={1.5} />
                  {bp.telefon}
                </a>
              )}
            </div>
          </div>
        </Container>
      </Section>

      {/* Aktive Mandate */}
      {mandate && mandate.length > 0 && (
        <Section className="bg-paper border-y border-stone">
          <Container>
            <div className="mb-8">
              <p className="overline text-bronze-ink mb-2">Aktive Mandate</p>
              <h2 className="font-serif text-display-md text-navy font-light">
                {mandate.length} Inserat{mandate.length !== 1 ? 'e' : ''} live
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mandate.map((m: any) => (
                <Link
                  key={m.id}
                  href={m.public_id ? `/inserat/${m.public_id}` : `/inserat/${m.id}`}
                  className="group rounded-card border border-stone bg-cream/40 p-5 hover:border-bronze/40 hover:shadow-card transition-all"
                >
                  {m.cover_url && (
                    <img
                      src={m.cover_url}
                      alt=""
                      className="w-full h-32 object-cover rounded-soft mb-3"
                    />
                  )}
                  <p className="font-serif text-head-sm text-navy mb-1">
                    {m.titel || 'Inserat'}
                  </p>
                  <p className="text-caption text-muted">
                    {m.branche ?? '—'} · {m.kanton ?? '—'}
                  </p>
                  <p className="mt-3 text-caption text-bronze-ink inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                    Ansehen <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
                  </p>
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* CTA */}
      <Section className="py-16">
        <Container>
          <div className="text-center">
            <p className="text-body text-muted mb-4">Interesse an einem der Mandate?</p>
            <Button href="/auth/register?role=kaeufer" size="lg">
              Kostenlos registrieren <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </Button>
          </div>
        </Container>
      </Section>

      <SiteFooter />
    </main>
  );
}
