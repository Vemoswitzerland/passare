import { Package, Calendar, ArrowRight, Check, AlertCircle, Zap, Mail, Clock } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { hasTable } from '@/lib/db/has-table';
import { POWERUPS, type Powerup } from '@/data/pakete';

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
    .eq('verkaeufer_id', userData.user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!inserat) return <NoData message="Erstelle zuerst ein Inserat." />;

  // Aktivierte Boosts laden — pro Inserat
  const { data: aktiveBoosts } = (await hasTable('inserat_powerups'))
    ? await supabase
        .from('inserat_powerups')
        .select('id, powerup_id, menge, preis_chf, aktiviert_at, laeuft_bis, status')
        .eq('inserat_id', inserat.id)
        .order('aktiviert_at', { ascending: false })
    : { data: [] };

  const aktiveBoostIds = new Set((aktiveBoosts ?? []).map((b: any) => b.powerup_id));

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

            {/* ── BOOSTS / Add-Ons ──────────────────────────── */}
            <div className="rounded-card bg-paper border border-stone p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-head-sm text-navy">Boosts & Add-Ons</h3>
                <span className="text-caption text-quiet font-mono">
                  {(aktiveBoosts ?? []).length} aktiv
                </span>
              </div>

              {/* Aktive Boosts */}
              {(aktiveBoosts ?? []).length > 0 && (
                <div className="mb-5">
                  <p className="overline text-bronze-ink mb-2">Aktiviert</p>
                  <ul className="space-y-2">
                    {(aktiveBoosts ?? []).map((boost: any) => {
                      const meta = POWERUPS.find((p) => p.id === boost.powerup_id);
                      const Icon = meta?.icon === 'Mail' ? Mail : meta?.icon === 'Clock' ? Clock : Zap;
                      const laeuft = boost.laeuft_bis ? new Date(boost.laeuft_bis) : null;
                      const aktiv = !laeuft || laeuft.getTime() > Date.now();
                      return (
                        <li key={boost.id} className="flex items-center gap-3 p-3 bg-cream/40 border border-stone/40 rounded-soft">
                          <span className={`w-9 h-9 rounded-soft flex items-center justify-center flex-shrink-0 ${aktiv ? 'bg-bronze/15 text-bronze-ink' : 'bg-stone text-quiet'}`}>
                            <Icon className="w-4 h-4" strokeWidth={1.5} />
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-body-sm text-navy font-medium">{meta?.label ?? boost.powerup_id}</p>
                            <p className="text-caption text-quiet">
                              {laeuft
                                ? aktiv
                                  ? `Aktiv bis ${laeuft.toLocaleDateString('de-CH')}`
                                  : `Abgelaufen am ${laeuft.toLocaleDateString('de-CH')}`
                                : 'Einmalig — bereits eingelöst'}
                            </p>
                          </div>
                          <span className="text-caption font-mono text-quiet">
                            CHF {Number(boost.preis_chf).toLocaleString('de-CH')}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Verfügbare Boosts */}
              <p className="overline text-bronze-ink mb-2">Dazubuchen</p>
              <div className="grid sm:grid-cols-3 gap-3">
                {POWERUPS.map((p) => {
                  const istAktiv = aktiveBoostIds.has(p.id) && p.laufzeitTage !== null;
                  const Icon = p.icon === 'Mail' ? Mail : p.icon === 'Clock' ? Clock : Zap;
                  return (
                    <div
                      key={p.id}
                      className="rounded-soft border border-stone p-4 hover:border-bronze/40 transition-colors flex flex-col"
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <span className="w-8 h-8 rounded-soft bg-bronze/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-bronze-ink" strokeWidth={1.5} />
                        </span>
                        <div className="min-w-0">
                          <p className="font-serif text-head-sm text-navy leading-tight">{p.label}</p>
                          <p className="text-caption text-quiet">{p.einheit}</p>
                        </div>
                      </div>
                      <p className="text-caption text-muted leading-snug mb-3 flex-1">{p.tagline}</p>
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone/40">
                        <span className="font-mono text-body-sm text-navy">CHF {p.preis}</span>
                        {istAktiv ? (
                          <span className="inline-flex items-center gap-1 text-caption text-success font-medium">
                            <Check className="w-3 h-3" strokeWidth={2} /> Aktiv
                          </span>
                        ) : (
                          <Link
                            href={`/dashboard/verkaeufer/inserat/${inserat.id}/edit?step=5&boost=${p.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-bronze text-cream rounded-soft text-caption font-medium hover:bg-bronze-ink transition-colors"
                          >
                            Buchen <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

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
