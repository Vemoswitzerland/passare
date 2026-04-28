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
        actions={
          <Button href="/admin/blog/neu" variant="primary" size="sm">
            <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
            Manuell schreiben
          </Button>
        }
      />

      {/* Counts-Strip */}
      <div className="flex items-center gap-3 text-caption text-quiet font-mono mb-4">
        <span>{totalCount ?? 0} Beiträge</span>
        <span className="text-stone">·</span>
        <span>{draftCount ?? 0} Entwürfe</span>
        <span className="text-stone">·</span>
        <span>{publishedCount ?? 0} veröffentlicht</span>
      </div>

      {/* KI-Generator-Strip — kompakt */}
      <section className="bg-paper border border-stone rounded-soft p-3 mb-5 flex items-center gap-3 flex-wrap">
        <Sparkles className="w-4 h-4 text-bronze flex-shrink-0" strokeWidth={1.5} />
        <div className="flex-1 min-w-0">
          <p className="text-body-sm text-navy font-medium leading-tight">KI-Generator</p>
          <p className="text-caption text-quiet leading-tight">
            Artikel zu Schweizer KMU-Nachfolge generieren. Landet als Entwurf.
          </p>
        </div>
        {aiKeyConfigured ? (
          <BlogGenerateButton />
        ) : (
          <span className="text-caption text-warn font-medium">
            ANTHROPIC_API_KEY in ENV setzen
          </span>
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
