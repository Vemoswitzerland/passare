import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Edit2, Eye, FileText, ArrowRight, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { hasTable } from '@/lib/db/has-table';
import { submitForReview } from './actions';
import { formatCHFShort } from '@/lib/valuation';
import { InseratStatusBanner } from '@/components/verkaeufer/InseratStatusBanner';
import { InseratAuditThread } from '@/components/admin/InseratAuditThread';

export const metadata = { title: 'Mein Inserat — passare Verkäufer' };

export default async function InseratIndexPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  if (!(await hasTable('inserate'))) {
    return <NoTableYet />;
  }

  const { data: inserat } = await supabase
    .from('inserate')
    .select('*, branchen(label_de)')
    .eq('verkaeufer_id', userData.user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!inserat) {
    redirect('/dashboard/verkaeufer/inserat/new');
  }

  return (
    <div className="px-6 md:px-10 py-8 md:py-12">
      <div className="max-w-content mx-auto">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <p className="overline text-bronze-ink mb-2">Mein Inserat</p>
            <h1 className="font-serif text-display-sm text-navy font-light tracking-tight">
              {inserat.titel || inserat.firma_name || 'Entwurf'}
            </h1>
          </div>
          <StatusBadge status={inserat.status} />
        </div>

        {/* Status-Banner mit Antwort-Form bei Rückfrage */}
        <div className="mb-6">
          <InseratStatusBanner
            inseratId={inserat.id}
            status={inserat.status}
            rejectionReason={inserat.rejection_reason ?? inserat.status_reason ?? null}
          />
        </div>

        {/* Konversations-Thread mit Admin */}
        {(['rueckfrage', 'pending', 'zur_pruefung', 'abgelehnt'] as const).includes(inserat.status as 'rueckfrage' | 'pending' | 'zur_pruefung' | 'abgelehnt') && (
          <section className="mb-6 bg-paper border border-stone rounded-soft p-4">
            <h3 className="text-[11px] uppercase tracking-wide font-medium text-quiet mb-3">
              Konversation mit dem passare-Team
            </h3>
            <InseratAuditThread
              inseratId={inserat.id}
              emptyHint="Noch keine Nachricht. Sobald das Team eine Rückfrage stellt, erscheint sie hier."
            />
          </section>
        )}

        {/* Inserat-Karte */}
        <div className="rounded-card bg-paper border border-stone overflow-hidden mb-6">
          {inserat.cover_url && (
            <div className="aspect-[16/7] bg-stone overflow-hidden relative">
              {inserat.cover_url.startsWith('http') && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={inserat.cover_url} alt={inserat.titel ?? ''} className="w-full h-full object-cover" />
              )}
            </div>
          )}
          <div className="p-6 md:p-8">
            <div className="flex flex-wrap gap-x-6 gap-y-3 mb-6">
              <Detail label="Branche" value={inserat.branchen?.label_de ?? '—'} />
              <Detail label="Kanton" value={inserat.kanton ?? '—'} />
              <Detail label="Mitarbeitende" value={inserat.mitarbeitende?.toString() ?? '—'} />
              <Detail label="Gründungsjahr" value={inserat.jahr?.toString() ?? '—'} />
              {inserat.umsatz_chf && <Detail label="Umsatz" value={formatCHFShort(Number(inserat.umsatz_chf))} mono />}
              {inserat.ebitda_marge_pct && <Detail label="EBITDA-Marge" value={`${inserat.ebitda_marge_pct}%`} mono />}
            </div>

            {inserat.beschreibung && (
              <p className="text-body text-muted leading-relaxed mb-6 line-clamp-3">{inserat.beschreibung}</p>
            )}

            {inserat.sales_points && inserat.sales_points.length > 0 && (
              <ul className="space-y-2 mb-6">
                {inserat.sales_points.map((p: string, i: number) => (
                  <li key={i} className="text-body-sm text-ink flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-bronze flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                    {p}
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-wrap gap-3 pt-6 border-t border-stone">
              <Link
                href={`/dashboard/verkaeufer/inserat/${inserat.id}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-navy text-cream rounded-soft text-body-sm font-medium hover:bg-ink shadow-subtle transition-all"
              >
                <Edit2 className="w-4 h-4" strokeWidth={1.5} />
                Bearbeiten
              </Link>
              {inserat.status === 'entwurf' && inserat.titel && inserat.cover_url && (
                <form action={async () => { 'use server'; await submitForReview(inserat.id); }}>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-bronze text-cream rounded-soft text-body-sm font-medium hover:bg-bronze-ink transition-all"
                  >
                    <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                    Zur Prüfung einreichen
                  </button>
                </form>
              )}
              <Link
                href={`/dashboard/verkaeufer/preview/${inserat.id}`}
                target="_blank"
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-stone hover:border-navy/40 text-navy rounded-soft text-body-sm font-medium transition-all"
              >
                <Eye className="w-4 h-4" strokeWidth={1.5} />
                Vorschau
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NoTableYet() {
  return (
    <div className="px-6 md:px-10 py-16 text-center">
      <FileText className="w-12 h-12 mx-auto text-quiet mb-4" strokeWidth={1.5} />
      <h2 className="font-serif text-head-md text-navy mb-2">Datenbank noch nicht bereit</h2>
      <p className="text-body text-muted">Migration läuft. Bitte in Kürze erneut versuchen.</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    entwurf: { label: 'Entwurf', cls: 'bg-stone text-quiet' },
    zur_pruefung: { label: 'In Prüfung', cls: 'bg-warn/15 text-warn' },
    live: { label: 'Live', cls: 'bg-success/15 text-success' },
    pausiert: { label: 'Pausiert', cls: 'bg-stone text-muted' },
    verkauft: { label: 'Verkauft', cls: 'bg-bronze-soft text-bronze-ink' },
    abgelaufen: { label: 'Abgelaufen', cls: 'bg-stone text-quiet' },
    abgelehnt: { label: 'Abgelehnt', cls: 'bg-danger/15 text-danger' },
  };
  const m = map[status] ?? map.entwurf;
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-pill text-caption font-medium ${m.cls}`}>
      {m.label}
    </span>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="overline text-quiet text-caption mb-1">{label}</p>
      <p className={mono ? 'text-body text-navy font-mono' : 'text-body text-navy'}>{value}</p>
    </div>
  );
}
