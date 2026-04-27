import Link from 'next/link';
import { ArrowRight, BookOpen, Mail } from 'lucide-react';
import { Container, Section } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Reveal, RevealStagger, RevealItem } from '@/components/ui/reveal';
import { Divider } from '@/components/ui/divider';
import { SiteHeader } from '../page';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Ratgeber — Firmenverkauf, Bewertung, NDA — passare',
  description:
    'Fachartikel zur Nachfolgeregelung von Schweizer KMU. Bewertungsmethoden, NDA-Klauseln, der richtige Verkaufszeitpunkt — pragmatisch erklärt.',
  robots: { index: false, follow: false },
};

export const revalidate = 600;

type Artikel = {
  id: string;
  slug: string;
  titel: string;
  lead: string;
  kategorie: string | null;
  cover_url: string | null;
  autor: string;
  published_at: string;
};

async function loadArtikel(): Promise<Artikel[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('artikel')
      .select('id, slug, titel, lead, kategorie, cover_url, autor, published_at')
      .not('published_at', 'is', null)
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false });

    if (error || !data) return [];
    return data as Artikel[];
  } catch {
    return [];
  }
}

export default async function RatgeberPage() {
  const artikel = await loadArtikel();

  return (
    <main className="min-h-screen flex flex-col bg-cream">
      <SiteHeader />
      <Hero count={artikel.length} />
      <ArtikelGrid artikel={artikel} />
      <Newsletter />
      <Footer />
    </main>
  );
}

function Hero({ count }: { count: number }) {
  return (
    <section className="relative overflow-hidden pt-12 md:pt-20 pb-10 md:pb-14">
      <Container size="wide">
        <Reveal>
          <p className="overline mb-5 text-bronze-ink">Ratgeber</p>
          <h1 className="font-serif text-[clamp(2.25rem,4.5vw,4rem)] text-navy font-light tracking-[-0.025em] leading-[1.05] max-w-hero mb-6">
            Wissen für Verkäufer <span className="text-muted italic">und Käufer<span className="not-italic text-bronze">.</span></span>
          </h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="text-body-lg text-muted max-w-prose leading-relaxed mb-8">
            Pragmatische Fachartikel zur Schweizer KMU-Nachfolge — Bewertung, Recht, Strategie.
            Geschrieben aus der Praxis, ohne Beraterprosa.
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] uppercase tracking-widest text-quiet">
            <SignalDot>{count} {count === 1 ? 'Artikel' : 'Artikel'}</SignalDot>
            <span className="w-px h-3 bg-stone" />
            <SignalDot>Wöchentlich neu</SignalDot>
            <span className="w-px h-3 bg-stone" />
            <SignalDot>passare-Redaktion</SignalDot>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

function SignalDot({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="w-1 h-1 rounded-full bg-bronze" />
      {children}
    </span>
  );
}

function ArtikelGrid({ artikel }: { artikel: Artikel[] }) {
  if (artikel.length === 0) {
    return (
      <Section>
        <Container size="wide">
          <div className="bg-paper border border-stone rounded-card p-12 text-center">
            <BookOpen className="w-8 h-8 text-bronze mx-auto mb-4" strokeWidth={1.5} />
            <p className="font-serif text-head-lg text-navy mb-3">Bald geht&apos;s los</p>
            <p className="text-body text-muted">Die Redaktion bereitet die ersten Artikel vor. Schauen Sie in Kürze wieder vorbei.</p>
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <section className="pb-16 md:pb-24">
      <Container size="wide">
        <RevealStagger className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {artikel.map((a) => (
            <RevealItem key={a.id} className="group">
              <Link href={`/ratgeber/${a.slug}`} className="block h-full">
                <article className="bg-paper border border-stone rounded-card overflow-hidden h-full flex flex-col transition-all duration-300 ease-out-expo group-hover:-translate-y-1 group-hover:shadow-lift">
                  {a.cover_url && (
                    <div className="relative aspect-[16/10] overflow-hidden bg-cream">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={a.cover_url}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="p-7 flex-1 flex flex-col">
                    {a.kategorie && (
                      <p className="font-mono text-[10px] uppercase tracking-widest text-bronze-ink mb-3">
                        {a.kategorie}
                      </p>
                    )}
                    <h2 className="font-serif text-head-md text-navy font-normal leading-snug mb-3 group-hover:text-bronze-ink transition-colors">
                      {a.titel}
                    </h2>
                    <p className="text-body-sm text-muted leading-relaxed mb-5 flex-1">
                      {a.lead}
                    </p>
                    <div className="flex items-center justify-between text-caption text-quiet">
                      <span className="font-mono text-[11px]">
                        {new Date(a.published_at).toLocaleDateString('de-CH', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                        })}
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-widest text-bronze-ink group-hover:gap-2 transition-all">
                        Lesen <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            </RevealItem>
          ))}
        </RevealStagger>
      </Container>
    </section>
  );
}

function Newsletter() {
  return (
    <Section className="bg-navy text-cream">
      <Container>
        <div className="max-w-hero">
          <Reveal>
            <Mail className="w-8 h-8 text-bronze mb-6" strokeWidth={1.5} />
            <h2 className="font-serif text-display-md md:text-display-lg text-cream font-light leading-[1.08] mb-8">
              Neue Artikel direkt ins Postfach<span className="text-bronze">.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-body-lg text-cream/80 max-w-prose leading-relaxed mb-10">
              Ein bis zwei Artikel pro Monat. Keine Werbung, kein Spam — Sie können jederzeit abbestellen.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <Button href="/auth/register?ref=ratgeber" variant="bronze" size="lg">
                Newsletter abonnieren <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </Button>
              <Button href="/bewerten" size="lg" className="bg-transparent border border-cream/25 text-cream hover:bg-cream/10">
                Firma bewerten
              </Button>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-stone pt-16 pb-10 bg-cream mt-auto">
      <Container>
        <div className="grid md:grid-cols-4 gap-10 mb-16">
          <div className="md:col-span-2">
            <p className="font-serif text-3xl text-navy mb-4">
              passare<span className="text-bronze">.</span>
            </p>
            <p className="text-body-sm text-muted max-w-xs leading-relaxed">
              Die Schweizer Self-Service-Plattform für die Nachfolge von KMU.
            </p>
          </div>
          <div>
            <p className="overline mb-4">Plattform</p>
            <ul className="space-y-3 text-body-sm text-muted">
              <li><Link className="hover:text-navy" href="/verkaufen">Inserieren</Link></li>
              <li><Link className="hover:text-navy" href="/kaufen">Firmen entdecken</Link></li>
              <li><Link className="hover:text-navy" href="/preise">Preise</Link></li>
            </ul>
          </div>
          <div>
            <p className="overline mb-4">Tools</p>
            <ul className="space-y-3 text-body-sm text-muted">
              <li><Link className="hover:text-navy" href="/atlas">Firmen-Atlas</Link></li>
              <li><Link className="hover:text-navy" href="/bewerten">Gratis-Bewertung</Link></li>
            </ul>
          </div>
        </div>
        <Divider className="mb-6" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-caption text-quiet">
          <p className="font-mono text-[11px] uppercase tracking-widest">
            &copy; {new Date().getFullYear()} passare &middot; «Made in Switzerland»
          </p>
        </div>
      </Container>
    </footer>
  );
}
