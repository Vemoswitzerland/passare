import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Eye, X, AlertTriangle, MapPin, Calendar, Users, TrendingUp, Building2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatCHFShort } from '@/lib/valuation';

export const metadata = { title: 'Vorschau — passare', robots: { index: false, follow: false } };

type Props = { params: Promise<{ id: string }> };

export default async function PreviewPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) notFound();

  const { data: inserat } = await supabase
    .from('inserate')
    .select('*, branchen(label_de)')
    .eq('id', id)
    .maybeSingle();
  if (!inserat || inserat.verkaeufer_id !== userData.user.id) notFound();

  // Anonymitäts-Check
  const warnings: string[] = [];
  if (inserat.firma_name) {
    const fname = inserat.firma_name.split(/[\s,]/)[0]?.toLowerCase();
    if (fname && fname.length > 3) {
      const titleLower = (inserat.titel ?? '').toLowerCase();
      const descLower = (inserat.beschreibung ?? '').toLowerCase();
      const teaserLower = (inserat.teaser ?? '').toLowerCase();
      if (titleLower.includes(fname)) warnings.push(`Dein Firmenname taucht im Titel auf — anonymisieren!`);
      if (teaserLower.includes(fname)) warnings.push(`Dein Firmenname taucht im Teaser auf.`);
      if (descLower.includes(fname)) warnings.push(`Dein Firmenname taucht in der Beschreibung auf.`);
    }
  }

  return (
    <main className="min-h-screen bg-cream">
      {/* Preview-Banner */}
      <div className="sticky top-0 z-40 bg-bronze/90 text-cream backdrop-blur-md">
        <div className="max-w-content mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" strokeWidth={1.5} />
            <span className="text-body-sm font-medium">PREVIEW · So sehen Käufer dein Inserat</span>
          </div>
          <Link
            href={`/dashboard/verkaeufer/inserat/${inserat.id}/edit`}
            className="inline-flex items-center gap-2 text-caption hover:underline"
          >
            <X className="w-4 h-4" strokeWidth={1.5} /> Schliessen
          </Link>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="bg-warn/10 border-b border-warn/30">
          <div className="max-w-content mx-auto px-6 py-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-warn flex-shrink-0 mt-0.5" strokeWidth={1.5} />
            <div className="flex-1">
              <p className="text-body-sm text-warn font-medium mb-1">Anonymitäts-Hinweise</p>
              <ul className="text-caption text-warn space-y-0.5">
                {warnings.map((w, i) => <li key={i}>· {w}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Inserat-Hero */}
      <div className="max-w-content mx-auto px-6 py-8 md:py-12">
        {inserat.cover_url && (
          <div className="rounded-card overflow-hidden mb-8 aspect-[16/7] bg-stone">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={inserat.cover_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_320px] gap-12">
          <div>
            <p className="overline text-bronze-ink mb-3">
              {inserat.branchen?.label_de ?? 'KMU'} · {inserat.kanton ?? '—'}
            </p>
            <h1 className="font-serif text-display-sm text-navy font-light tracking-tight mb-4">
              {inserat.titel ?? '(Titel fehlt)'}
            </h1>
            {inserat.teaser && (
              <p className="text-body-lg text-muted leading-relaxed mb-8">
                {inserat.teaser}
              </p>
            )}

            {inserat.sales_points && inserat.sales_points.length > 0 && (
              <div className="rounded-card bg-paper border border-stone p-6 mb-8">
                <p className="overline text-bronze-ink mb-4">Stärken</p>
                <ul className="space-y-2">
                  {inserat.sales_points.map((p: string, i: number) => (
                    <li key={i} className="text-body text-ink flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 text-bronze flex-shrink-0 mt-1" strokeWidth={1.5} />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-card bg-paper border border-stone p-6 mb-8">
              <p className="overline text-bronze-ink mb-4">Beschreibung</p>
              {inserat.beschreibung ? (
                <p className="text-body text-ink whitespace-pre-wrap leading-relaxed">{inserat.beschreibung}</p>
              ) : (
                <p className="text-body text-quiet italic">Volldetails nach NDA-Signatur</p>
              )}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-card bg-paper border border-stone p-6">
              <p className="overline text-bronze-ink mb-3">Eckdaten</p>
              <dl className="space-y-3">
                <FactRow icon={Building2} label="Branche" value={inserat.branchen?.label_de ?? '—'} />
                <FactRow icon={MapPin} label="Kanton" value={inserat.kanton ?? '—'} />
                <FactRow icon={Calendar} label="Gegründet" value={inserat.jahr?.toString() ?? '—'} />
                <FactRow icon={Users} label="Mitarbeitende" value={inserat.mitarbeitende?.toString() ?? '—'} />
                {inserat.umsatz_chf && <FactRow icon={TrendingUp} label="Umsatz" value={formatCHFShort(Number(inserat.umsatz_chf))} mono />}
                {inserat.ebitda_marge_pct && <FactRow icon={TrendingUp} label="EBITDA-Marge" value={`${inserat.ebitda_marge_pct}%`} mono />}
              </dl>
            </div>

            <div className="rounded-card bg-bronze/5 border border-bronze/30 p-6">
              <p className="overline text-bronze-ink mb-2">Kaufpreis</p>
              {inserat.kaufpreis_vhb ? (
                <p className="font-serif text-head-md text-navy font-light">VHB</p>
              ) : inserat.kaufpreis_chf ? (
                <p className="font-serif text-head-md text-navy font-light font-tabular">{formatCHFShort(Number(inserat.kaufpreis_chf))}</p>
              ) : (
                <p className="text-body text-quiet">Auf Anfrage</p>
              )}
              {inserat.uebergabe_grund && (
                <p className="mt-3 text-caption text-muted">
                  Übergabe-Grund: {inserat.uebergabe_grund.replace(/_/g, ' ')}
                </p>
              )}
            </div>

            <button
              type="button"
              disabled
              className="w-full px-6 py-4 bg-navy text-cream rounded-soft text-body-sm font-medium opacity-50 cursor-not-allowed"
            >
              Anfrage senden (Käufer-Aktion)
            </button>
            <p className="text-caption text-quiet text-center">
              Käufer-Aktion ist im Preview deaktiviert
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}

function FactRow({ icon: Icon, label, value, mono }: { icon: any; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-body-sm">
      <Icon className="w-3.5 h-3.5 text-quiet flex-shrink-0" strokeWidth={1.5} />
      <span className="text-quiet flex-1">{label}</span>
      <span className={mono ? 'font-mono text-navy' : 'text-navy'}>{value}</span>
    </div>
  );
}
