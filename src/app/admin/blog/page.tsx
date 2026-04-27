import Link from 'next/link';
import {
  Plus,
  Sparkles,
  ChevronRight,
  ExternalLink,
  PenLine,
  CheckCircle2,
  Circle,
  Newspaper,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { DataTable, Td, Tr } from '@/components/admin/DataTable';
import { BlogGenerateButton } from '@/components/admin/BlogGenerateButton';
import { BlogFilterTabs } from '@/components/admin/BlogFilterTabs';
import { PageHeader, EmptyState } from '@/components/admin/PageHeader';
import { KATEGORIE_LABEL, type BlogKategorie } from '@/data/blog-topics';
import { cn } from '@/lib/utils';

export const metadata = {
  title: 'Admin · Blog — passare',
  robots: { index: false, follow: false },
};

type BlogRow = {
  id: string;
  slug: string;
  titel: string;
  kategorie: BlogKategorie;
  autor: string;
  status: 'entwurf' | 'veroeffentlicht';
  ai_generated: boolean;
  ai_topic: string | null;
  reading_minutes: number | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
};

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; kategorie?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = params.status ?? 'alle';
  const kategorieFilter = params.kategorie ?? 'alle';

  const supabase = await createClient();
  let q = supabase.from('blog_posts').select('*').order('updated_at', { ascending: false });
  if (statusFilter === 'entwurf' || statusFilter === 'veroeffentlicht') {
    q = q.eq('status', statusFilter);
  }
  if (kategorieFilter !== 'alle') q = q.eq('kategorie', kategorieFilter);

  const { data: postsData } = await q;
  const posts = (postsData ?? []) as BlogRow[];

  // Counts für Tabs
  const [{ count: totalCount }, { count: draftCount }, { count: publishedCount }] = await Promise.all([
    supabase.from('blog_posts').select('id', { count: 'exact', head: true }),
    supabase.from('blog_posts').select('id', { count: 'exact', head: true }).eq('status', 'entwurf'),
    supabase.from('blog_posts').select('id', { count: 'exact', head: true }).eq('status', 'veroeffentlicht'),
  ]);

  const aiKeyConfigured = !!process.env.ANTHROPIC_API_KEY;

  return (
    <div className="max-w-6xl">
      <PageHeader
        overline="Inhalt"
        title="Blog"
        description={`${totalCount ?? 0} Beiträge · ${draftCount ?? 0} Entwürfe · ${publishedCount ?? 0} veröffentlicht. Spezialisiert auf KMU-Nachfolge, Verkauf, Bewertung, Recht, Steuern.`}
        actions={
          <Button href="/admin/blog/neu" variant="primary" size="sm">
            <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
            Manuell schreiben
          </Button>
        }
      />

      {/* Auto-Generator-Banner */}
      <section className="bg-gradient-to-br from-bronze-soft/40 to-paper border border-bronze/40 rounded-card p-6 mb-6 relative overflow-hidden">
        <div className="absolute right-4 top-4 opacity-20">
          <Sparkles className="w-12 h-12 text-bronze" strokeWidth={1.5} />
        </div>
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-soft bg-bronze flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-cream" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <h2 className="font-serif text-xl text-navy mb-1">KI-Generator</h2>
            <p className="text-body-sm text-muted leading-relaxed">
              Claude schreibt einen Blog-Artikel passgenau für die Schweizer
              KMU-Nachfolge. Wähle ein Thema oder lass die KI eines aus dem
              passare-Themen-Katalog vorschlagen. Der Artikel landet als
              Entwurf — du prüfst und veröffentlichst.
            </p>
          </div>
        </div>

        {aiKeyConfigured ? (
          <BlogGenerateButton />
        ) : (
          <div className="bg-warn/10 border border-warn/30 rounded-soft px-4 py-3 text-body-sm text-navy">
            <strong>ANTHROPIC_API_KEY fehlt</strong> in Vercel-ENV.
            Trage den Schlüssel ein, dann ist der Generator aktiv.
          </div>
        )}
      </section>

      {/* Filter */}
      <BlogFilterTabs
        statusFilter={statusFilter}
        kategorieFilter={kategorieFilter}
        counts={{
          alle: totalCount ?? 0,
          entwurf: draftCount ?? 0,
          veroeffentlicht: publishedCount ?? 0,
        }}
      />

      {posts.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title={statusFilter === 'alle' ? 'Noch kein Beitrag' : 'Keine Treffer für diesen Filter'}
          description={
            statusFilter === 'alle'
              ? 'Klick auf «Blog-Artikel generieren» oben oder schreibe manuell einen Artikel.'
              : 'Andere Status oder Kategorie probieren.'
          }
        />
      ) : (
      <DataTable
        columns={[
          { key: 'titel', label: 'Titel' },
          { key: 'kategorie', label: 'Kategorie' },
          { key: 'autor', label: 'Autor' },
          { key: 'status', label: 'Status' },
          { key: 'updated', label: 'Geändert' },
          { key: 'arrow', label: '', align: 'right' },
        ]}
      >
        {posts.map((p) => (
          <Tr key={p.id} className="cursor-pointer">
            <Td>
              <Link href={`/admin/blog/${p.id}`} className="block hover:text-bronze-ink transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-ink">{p.titel || <em className="text-quiet">Ohne Titel</em>}</span>
                  {p.ai_generated && (
                    <Sparkles className="w-3.5 h-3.5 text-bronze flex-shrink-0" strokeWidth={1.5} />
                  )}
                </div>
                <p className="text-caption text-quiet font-mono mt-0.5">/{p.slug}</p>
              </Link>
            </Td>
            <Td>
              <span className="inline-flex px-2 py-0.5 rounded-soft bg-stone/60 text-muted text-caption font-medium">
                {KATEGORIE_LABEL[p.kategorie] ?? p.kategorie}
              </span>
            </Td>
            <Td className="text-caption text-quiet">{p.autor}</Td>
            <Td>
              {p.status === 'veroeffentlicht' ? (
                <span className="inline-flex items-center gap-1.5 text-caption text-success">
                  <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} />
                  Veröffentlicht
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-caption text-quiet">
                  <Circle className="w-3.5 h-3.5" strokeWidth={2} />
                  Entwurf
                </span>
              )}
            </Td>
            <Td className="font-mono text-caption text-quiet whitespace-nowrap">
              {formatDate(p.updated_at)}
            </Td>
            <Td align="right">
              <div className="inline-flex gap-1 items-center">
                {p.status === 'veroeffentlicht' && (
                  <a
                    href={`/ratgeber/${p.slug}`}
                    target="_blank"
                    rel="noopener"
                    title="Public-Ansicht öffnen"
                    className="p-2 rounded-soft border border-stone bg-paper text-quiet hover:text-navy hover:border-navy/40 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </a>
                )}
                <Link
                  href={`/admin/blog/${p.id}`}
                  title="Bearbeiten"
                  className="p-2 rounded-soft border border-stone bg-paper text-quiet hover:text-navy hover:border-navy/40 transition-colors"
                >
                  <PenLine className="w-3.5 h-3.5" strokeWidth={1.5} />
                </Link>
                <Link
                  href={`/admin/blog/${p.id}`}
                  className="ml-1 p-1 text-quiet hover:text-bronze-ink transition-colors"
                >
                  <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                </Link>
              </div>
            </Td>
          </Tr>
        ))}
      </DataTable>
      )}
    </div>
  );
}
