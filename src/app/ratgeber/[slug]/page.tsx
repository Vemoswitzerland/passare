import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Calendar, User, Tag } from 'lucide-react';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { createClient } from '@supabase/supabase-js';
import { Container, Section } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/ui/reveal';
import { Divider } from '@/components/ui/divider';
import { SiteHeader } from '../../page';
import { mdxComponents } from '../components';

export const dynamic = 'force-static';
export const revalidate = 600;
export const dynamicParams = true;

/** Cookie-loser Public-Client für SSG/ISR (artikel-Tabelle = Public-RLS). */
function publicSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

type Artikel = {
  id: string;
  slug: string;
  titel: string;
  lead: string;
  body_mdx: string;
  autor: string;
  kategorie: string | null;
  cover_url: string | null;
  published_at: string;
};

async function loadArtikel(slug: string): Promise<Artikel | null> {
  try {
    const supabase = publicSupabase();
    const { data, error } = await supabase
      .from('artikel')
      .select('*')
      .eq('slug', slug)
      .not('published_at', 'is', null)
      .lte('published_at', new Date().toISOString())
      .maybeSingle();

    if (error || !data) return null;
    return data as Artikel;
  } catch {
    return null;
  }
}

async function loadOtherArtikel(currentSlug: string, limit = 2): Promise<Artikel[]> {
  try {
    const supabase = publicSupabase();
    const { data } = await supabase
      .from('artikel')
      .select('id, slug, titel, lead, kategorie, cover_url, autor, published_at, body_mdx')
      .neq('slug', currentSlug)
      .not('published_at', 'is', null)
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false })
      .limit(limit);
    return (data ?? []) as Artikel[];
  } catch {
    return [];
  }
}

export async function generateStaticParams() {
  try {
    const supabase = publicSupabase();
    const { data } = await supabase
      .from('artikel')
      .select('slug')
      .not('published_at', 'is', null);
    return (data ?? []).map((a: { slug: string }) => ({ slug: a.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = await loadArtikel(slug);
  if (!a) return { title: 'Artikel nicht gefunden — passare', robots: { index: false, follow: false } };
  return {
    title: `${a.titel} — passare Ratgeber`,
    description: a.lead,
    openGraph: a.cover_url
      ? { images: [{ url: a.cover_url, width: 1600, height: 1000 }] }
      : undefined,
    robots: { index: false, follow: false },
  };
}

export default async function ArtikelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const artikel = await loadArtikel(slug);
  if (!artikel) notFound();
  const others = await loadOtherArtikel(slug);

  return (
    <main className="min-h-screen flex flex-col bg-cream">
      <SiteHeader />

      {/* Cover-Hero */}
      {artikel.cover_url && (
        <div className="relative w-full aspect-[21/9] md:aspect-[3/1] max-h-[480px] bg-cream overflow-hidden border-b border-stone">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={artikel.cover_url}
            alt=""
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-cream/40 to-transparent" />
        </div>
      )}

      <article className="flex-1 py-12 md:py-20">
        <Container>
          <div className="max-w-prose mx-auto">
            <Reveal>
              <Link
                href="/ratgeber"
                className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-quiet hover:text-navy mb-8"
              >
                <ArrowLeft className="w-3 h-3" strokeWidth={1.5} />
                Alle Artikel
              </Link>
            </Reveal>

            <Reveal delay={0.05}>
              <header className="mb-10 pb-8 border-b border-stone">
                {artikel.kategorie && (
                  <p className="overline text-bronze-ink mb-5 inline-flex items-center gap-2">
                    <Tag className="w-3 h-3" strokeWidth={1.5} />
                    {artikel.kategorie}
                  </p>
                )}
                <h1 className="font-serif text-display-md md:text-display-lg text-navy font-light leading-[1.05] mb-6 tracking-[-0.02em]">
                  {artikel.titel}
                </h1>
                <p className="text-body-lg text-muted leading-relaxed mb-6">
                  {artikel.lead}
                </p>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] uppercase tracking-widest text-quiet">
                  <span className="inline-flex items-center gap-2">
                    <User className="w-3 h-3" strokeWidth={1.5} />
                    {artikel.autor}
                  </span>
                  <span className="w-px h-3 bg-stone" />
                  <span className="inline-flex items-center gap-2">
                    <Calendar className="w-3 h-3" strokeWidth={1.5} />
                    {new Date(artikel.published_at).toLocaleDateString('de-CH', {
                      day: '2-digit', month: 'long', year: 'numeric',
                    })}
                  </span>
                </div>
              </header>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="prose-passare">
                <MDXRemote
                  source={artikel.body_mdx}
                  components={mdxComponents}
                  options={{
                    mdxOptions: {
                      remarkPlugins: [(await import('remark-gfm')).default],
                    },
                  }}
                />
              </div>
            </Reveal>

            {/* CTA in Artikel */}
            <Reveal delay={0.15}>
              <div className="mt-16 p-6 md:p-8 bg-paper border border-stone rounded-card">
                <p className="overline mb-3 text-bronze-ink">Nächster Schritt</p>
                <h3 className="font-serif text-head-md text-navy font-normal mb-4">
                  Bereit für eine konkrete Indikation?
                </h3>
                <p className="text-body-sm text-muted mb-6 leading-relaxed">
                  Unser Gratis-Bewertungstool rechnet in 60 Sekunden den Marktwert Ihrer Firma —
                  basierend auf den aktuellen Branchen-Multiples.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button href="/bewerten" size="md">
                    Firma bewerten <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                  </Button>
                  <Button href="/atlas" variant="secondary" size="md">
                    Atlas öffnen
                  </Button>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </article>

      {others.length > 0 && (
        <Section className="bg-paper border-t border-stone">
          <Container>
            <Reveal>
              <p className="overline mb-5">Weitere Artikel</p>
              <h2 className="font-serif text-head-lg text-navy font-normal mb-10">Mehr aus dem Ratgeber.</h2>
            </Reveal>
            <div className="grid md:grid-cols-2 gap-8 max-w-content">
              {others.map((o) => (
                <Reveal key={o.id} delay={0.05}>
                  <Link href={`/ratgeber/${o.slug}`} className="group block">
                    <article className="border-t border-stone pt-6">
                      {o.kategorie && (
                        <p className="font-mono text-[10px] uppercase tracking-widest text-bronze-ink mb-2">{o.kategorie}</p>
                      )}
                      <h3 className="font-serif text-head-md text-navy font-normal leading-snug mb-2 group-hover:text-bronze-ink transition-colors">
                        {o.titel}
                      </h3>
                      <p className="text-body-sm text-muted leading-relaxed mb-3">{o.lead}</p>
                      <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-bronze-ink">
                        Lesen <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
                      </span>
                    </article>
                  </Link>
                </Reveal>
              ))}
            </div>
          </Container>
        </Section>
      )}

      <Footer />
    </main>
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
              <li><Link className="hover:text-navy" href="/ratgeber">Ratgeber</Link></li>
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
