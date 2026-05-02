import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus, ArrowRight, FileText, Eye, MessageSquare } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { hasTable } from '@/lib/db/has-table';
import { NewMandatDialog } from './NewMandatDialog';

export const metadata = { title: 'Mandate — passare Broker' };

type Props = { searchParams: Promise<{ action?: string }> };

export default async function MandatePage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;
  const sp = await searchParams;

  let mandate: any[] = [];
  let brokerProfile: any = null;

  if (await hasTable('broker_profiles')) {
    const { data: bp } = await supabase
      .from('broker_profiles')
      .select('tier, mandate_limit, subscription_status')
      .eq('id', userData.user.id)
      .maybeSingle();
    brokerProfile = bp;
  }

  if (await hasTable('inserate')) {
    const { data } = await supabase
      .from('inserate')
      .select('id, firma_name, titel, status, branche, kanton, views, created_at, updated_at')
      .eq('broker_id', userData.user.id)
      .order('updated_at', { ascending: false });
    mandate = data ?? [];
  }

  const mandateLimit = brokerProfile?.mandate_limit ?? 5;
  const activeCount = mandate.filter(m => !['verkauft', 'abgelaufen'].includes(m.status)).length;
  const canCreate = activeCount < mandateLimit && brokerProfile?.subscription_status === 'active';

  return (
    <div className="px-6 md:px-10 py-8 md:py-12">
      <div className="max-w-content mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <p className="overline text-bronze-ink mb-2">Mandate</p>
            <h1 className="font-serif text-display-sm text-navy font-light tracking-tight">
              Deine Mandate
            </h1>
            <p className="text-body text-muted mt-2">
              {activeCount} / {mandateLimit} aktive Mandate
            </p>
          </div>
          {canCreate && (
            <Link
              href="/dashboard/broker/mandate?action=new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy text-cream rounded-soft text-body-sm font-medium hover:bg-ink shadow-card hover:shadow-lift hover:-translate-y-px transition-all"
            >
              <Plus className="w-4 h-4" strokeWidth={1.5} />
              Neues Mandat
            </Link>
          )}
        </div>

        {/* Mandate-Liste */}
        {mandate.length === 0 ? (
          <div className="rounded-card bg-paper border border-stone p-10 text-center">
            <FileText className="w-10 h-10 text-stone mx-auto mb-4" strokeWidth={1.5} />
            <h2 className="font-serif text-head-md text-navy mb-2">Noch keine Mandate</h2>
            <p className="text-body-sm text-muted mb-6 max-w-sm mx-auto">
              Erstelle dein erstes Mandat und nutze den bewährten Inserat-Wizard, um es zu veröffentlichen.
            </p>
            {canCreate && (
              <Link
                href="/dashboard/broker/mandate?action=new"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy text-cream rounded-soft text-body-sm font-medium hover:bg-ink transition-colors"
              >
                <Plus className="w-4 h-4" strokeWidth={1.5} />
                Mandat erstellen
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {mandate.map((m) => (
              <MandatCard key={m.id} mandat={m} />
            ))}
          </div>
        )}

        {sp.action === 'new' && canCreate && <NewMandatDialog />}
      </div>
    </div>
  );
}

function MandatCard({ mandat }: { mandat: any }) {
  const statusColors: Record<string, string> = {
    entwurf: 'bg-stone text-quiet',
    zur_pruefung: 'bg-warn/15 text-warn',
    live: 'bg-success/15 text-success',
    pausiert: 'bg-stone text-quiet',
    verkauft: 'bg-bronze-soft text-bronze-ink',
    abgelaufen: 'bg-danger/10 text-danger',
    abgelehnt: 'bg-danger/10 text-danger',
  };

  const statusLabels: Record<string, string> = {
    entwurf: 'Entwurf',
    zur_pruefung: 'In Prüfung',
    live: 'Live',
    pausiert: 'Pausiert',
    verkauft: 'Verkauft',
    abgelaufen: 'Abgelaufen',
    abgelehnt: 'Abgelehnt',
  };

  return (
    <Link
      href={`/dashboard/verkaeufer/inserat/${mandat.id}/edit`}
      className="group flex items-center gap-4 rounded-card bg-paper border border-stone p-5 hover:border-bronze/40 hover:shadow-card transition-all"
    >
      <div className="w-10 h-10 rounded-soft bg-bronze/10 flex items-center justify-center flex-shrink-0">
        <FileText className="w-5 h-5 text-bronze-ink" strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-body text-navy font-medium truncate">
          {mandat.firma_name || mandat.titel || 'Unbenanntes Mandat'}
        </p>
        <p className="text-caption text-muted mt-0.5">
          {mandat.branche ?? '—'} · {mandat.kanton ?? '—'} · Aktualisiert {formatDate(mandat.updated_at)}
        </p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="hidden sm:inline-flex items-center gap-1 text-caption text-quiet">
          <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
          {mandat.views ?? 0}
        </span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-pill text-[10px] font-medium uppercase ${statusColors[mandat.status] ?? 'bg-stone text-quiet'}`}>
          {statusLabels[mandat.status] ?? mandat.status}
        </span>
        <ArrowRight className="w-4 h-4 text-quiet group-hover:text-bronze-ink transition-colors" strokeWidth={1.5} />
      </div>
    </Link>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / (24 * 60 * 60 * 1000));
  if (days === 0) return 'heute';
  if (days === 1) return 'gestern';
  if (days < 7) return `vor ${days} Tagen`;
  return new Intl.DateTimeFormat('de-CH', { day: '2-digit', month: '2-digit' }).format(d);
}
