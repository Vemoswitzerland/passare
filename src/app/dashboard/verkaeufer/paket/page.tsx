import { Package, Calendar, ArrowRight, Check, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { hasTable } from '@/lib/db/has-table';

export const metadata = { title: 'Paket — passare Verkäufer' };

const PAKETE_INFO = {
  light: { name: 'Light', price: 290, monate: 3, renew: 190 },
  pro: { name: 'Pro', price: 890, monate: 6, renew: 490 },
  premium: { name: 'Premium', price: 1890, monate: 12, renew: 990 },
} as const;

export default async function PaketPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  if (!(await hasTable('inserate'))) {
    return <NoData />;
  }

  const { data: inserat } = await supabase
    .from('inserate')
    .select('id, paket, paid_at, expires_at, stripe_session_id, status')
    .eq('owner_id', userData.user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!inserat) return <NoData message="Erstelle zuerst ein Inserat." />;

  const paket = inserat.paket ? PAKETE_INFO[inserat.paket as keyof typeof PAKETE_INFO] : null;
  const expiresAt = inserat.expires_at ? new Date(inserat.expires_at) : null;
  const paidAt = inserat.paid_at ? new Date(inserat.paid_at) : null;
  const totalDays = paket ? paket.monate * 30 : 0;
  const daysLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000))) : 0;
  const daysUsed = totalDays - daysLeft;
  const usedPct = totalDays > 0 ? Math.min(100, Math.max(0, (daysUsed / totalDays) * 100)) : 0;

  return (
    <div className="px-6 md:px-10 py-8 md:py-12">
      <div className="max-w-content mx-auto">
        <div className="mb-8">
          <p className="overline text-bronze-ink mb-2">Paket</p>
          <h1 className="font-serif text-display-sm text-navy font-light tracking-tight">
            Aktuelles Paket
          </h1>
        </div>

        {!paket ? (
          <div className="rounded-card bg-paper border border-stone p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-soft bg-warn/15 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-warn" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="font-serif text-head-md text-navy mb-1">Noch kein Paket gebucht</h2>
                <p className="text-body text-muted">
                  Schliesse den Inserat-Wizard ab und buche ein Paket, damit dein Inserat live geht.
                </p>
              </div>
            </div>
            <Link
              href={`/dashboard/verkaeufer/inserat/${inserat.id}/edit?step=5`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-navy text-cream rounded-soft text-body-sm font-medium hover:bg-ink transition-all"
            >
              Paket buchen <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </Link>
          </div>
        ) : (
          <>
            <div className="rounded-card bg-paper border border-stone p-8 mb-6">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <p className="overline text-bronze-ink mb-2">Aktiv</p>
                  <h2 className="font-serif text-display-sm text-navy font-light">
                    Inserat {paket.name}
                  </h2>
                  <p className="text-body text-muted mt-2 font-mono">
                    CHF {paket.price.toLocaleString('de-CH').replace(/,/g, "'")} · {paket.monate} Monate · einmalig
                  </p>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-pill bg-success/15 text-success text-caption font-medium">
                  <Check className="w-3 h-3 mr-1" strokeWidth={2} /> Aktiv
                </span>
              </div>

              <div className="space-y-3 mb-6 pb-6 border-b border-stone">
                <Row label="Gebucht am" value={paidAt?.toLocaleDateString('de-CH') ?? '—'} />
                <Row label="Läuft ab" value={expiresAt?.toLocaleDateString('de-CH') ?? '—'} />
                <Row label="Verbleibend" value={`${daysLeft} Tage`} highlight={daysLeft < 30} />
                {inserat.stripe_session_id && (
                  <Row label="Transaktions-ID" value={inserat.stripe_session_id} mono />
                )}
              </div>

              {expiresAt && (
                <div>
                  <div className="flex items-center justify-between mb-2 text-caption">
                    <span className="text-quiet">Laufzeit</span>
                    <span className="font-mono text-bronze-ink font-medium">{daysUsed} / {totalDays} Tage</span>
                  </div>
                  <div className="h-2 rounded-pill bg-stone overflow-hidden">
                    <div className="h-full bg-bronze transition-all" style={{ width: `${usedPct}%` }} />
                  </div>
                </div>
              )}
            </div>

            {daysLeft < 30 && daysLeft > 0 && (
              <div className="rounded-card bg-warn/5 border border-warn/30 p-6 mb-6">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-warn flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div>
                    <p className="font-medium text-navy mb-1">Inserat läuft bald ab</p>
                    <p className="text-body-sm text-muted mb-3">
                      Verlängere für CHF {paket.renew} um weitere {paket.monate} Monate. Inserat bleibt aktiv ohne Daten-Verlust.
                    </p>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-bronze text-cream rounded-soft text-body-sm font-medium hover:bg-bronze-ink transition-colors"
                    >
                      Verlängern (Stripe-Mock)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Upgrade-Optionen */}
            {inserat.paket !== 'premium' && (
              <div className="rounded-card bg-paper border border-stone p-6">
                <h3 className="font-serif text-head-sm text-navy mb-4">Auf grösseres Paket wechseln</h3>
                <p className="text-body-sm text-muted mb-4">
                  Mehr Bilder, längere Laufzeit, Premium-Features. Differenzbetrag wird verrechnet.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {(['pro', 'premium'] as const)
                    .filter((p) => p !== inserat.paket)
                    .map((p) => {
                      const info = PAKETE_INFO[p];
                      return (
                        <div key={p} className="rounded-soft border border-stone p-4 hover:border-bronze/40 transition-colors">
                          <p className="font-serif text-head-sm text-navy">{info.name}</p>
                          <p className="text-caption text-muted font-mono mt-1">CHF {info.price} · {info.monate}M</p>
                          <button
                            type="button"
                            className="mt-3 w-full text-caption text-bronze-ink hover:underline"
                          >
                            Upgrade prüfen →
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function NoData({ message }: { message?: string }) {
  return (
    <div className="px-6 py-16 text-center">
      <Package className="w-12 h-12 mx-auto text-quiet mb-4" strokeWidth={1.5} />
      <h2 className="font-serif text-head-md text-navy mb-2">Kein Paket aktiv</h2>
      <p className="text-body text-muted">{message ?? 'Erstelle ein Inserat und buche ein Paket.'}</p>
    </div>
  );
}

function Row({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between text-body-sm">
      <span className="text-quiet">{label}</span>
      <span className={
        (mono ? 'font-mono ' : '') +
        (highlight ? 'text-warn font-medium' : 'text-navy')
      }>
        {value}
      </span>
    </div>
  );
}
