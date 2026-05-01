import Link from 'next/link';
import { Calendar, Sparkles, ArrowRight, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Experten — passare Verkäufer' };

/**
 * Experten-Liste für Verkäufer — Calendly-ähnliches Buchungs-System.
 *
 * Cyrill 01.05.2026: «Experten-Reiter im Verkäuferbereich. Admin
 * pflegt Profile + Honorar. Verkäufer wählt Experten, bucht direkt
 * einen Termin, geht zum Checkout, Termin wird bestätigt.»
 *
 * Aufbau:
 *   - Eigene anstehende Termine (oben)
 *   - Liste aller aktiven Experten als Karten
 *   - Klick auf Karte → Detail-Page mit Slot-Picker
 */
export default async function ExpertenPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  // Aktive Experten — Sortierung nach sort_order
  const { data: experten } = await supabase
    .from('experten')
    .select('id, name, funktion, foto_url, bio, expertise, honorar_chf_pro_stunde, slot_dauer_min')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  // Eigene anstehende Termine
  const nowIso = new Date().toISOString();
  const { data: meineTermine } = await supabase
    .from('experten_termine')
    .select('id, experte_id, start_at, dauer_min, status, honorar_chf, thema')
    .eq('verkaeufer_id', userData.user.id)
    .gte('start_at', nowIso)
    .in('status', ['pending', 'paid', 'confirmed'])
    .order('start_at', { ascending: true });

  // Lookup für Termin-Anzeige
  const expertenLookup = new Map<string, { name: string; funktion: string | null }>();
  for (const e of experten ?? []) {
    expertenLookup.set(e.id as string, {
      name: e.name as string,
      funktion: (e.funktion as string | null) ?? null,
    });
  }

  return (
    <div className="px-6 md:px-10 py-8 md:py-12">
      <div className="max-w-content mx-auto">
        <div className="mb-8">
          <p className="overline text-bronze-ink mb-2">Experten</p>
          <h1 className="font-serif text-display-sm text-navy font-light tracking-tight">
            Beratungs-Termin buchen
          </h1>
          <p className="text-body text-muted mt-2 max-w-2xl">
            Brauchst du Unterstützung beim Verkauf? Buche direkt einen Termin mit
            unseren Experten — Bewertung, Verhandlung, Steuern, Recht. Alles transparent
            mit Stunden-Honorar, kein Erfolgsanteil.
          </p>
        </div>

        {/* ── Anstehende Termine ───────────────────────────────── */}
        {meineTermine && meineTermine.length > 0 && (
          <section className="mb-10">
            <h2 className="font-serif text-head-sm text-navy font-light mb-3">
              Deine anstehenden Termine
            </h2>
            <ul className="space-y-2">
              {meineTermine.map((t) => {
                const exp = expertenLookup.get(t.experte_id as string);
                return (
                  <li
                    key={t.id as string}
                    className="rounded-card bg-paper border border-stone p-4 flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-full bg-bronze/15 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-bronze-ink" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm text-navy font-medium">
                        {exp?.name ?? 'Experte'}
                        {exp?.funktion && <span className="text-quiet font-normal"> · {exp.funktion}</span>}
                      </p>
                      <p className="text-caption text-muted">
                        {formatDateLong(t.start_at as string)} · {t.dauer_min as number} min
                      </p>
                      {t.thema && (
                        <p className="text-caption text-quiet truncate mt-0.5">«{t.thema as string}»</p>
                      )}
                    </div>
                    <StatusBadge status={t.status as string} />
                    <span className="text-body-sm font-mono text-navy">
                      CHF {Number(t.honorar_chf ?? 0).toLocaleString('de-CH')}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* ── Experten-Liste ───────────────────────────────────── */}
        {!experten || experten.length === 0 ? (
          <div className="rounded-card bg-paper border border-stone p-12 text-center">
            <Sparkles className="w-10 h-10 mx-auto text-quiet mb-3" strokeWidth={1.5} />
            <h3 className="font-serif text-head-sm text-navy mb-1">Aktuell keine Experten verfügbar</h3>
            <p className="text-body-sm text-muted">Das passare-Team baut gerade das Berater-Netzwerk auf.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {experten.map((e) => (
              <Link
                key={e.id as string}
                href={`/dashboard/verkaeufer/experten/${e.id}`}
                className="group rounded-card bg-paper border border-stone hover:border-bronze/40 hover:shadow-subtle transition-all p-5 flex flex-col"
              >
                <div className="flex items-start gap-3 mb-3">
                  {e.foto_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={e.foto_url as string}
                      alt={e.name as string}
                      className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-bronze/15 flex items-center justify-center flex-shrink-0">
                      <span className="text-bronze-ink font-medium text-body-sm">
                        {deriveInitials(e.name as string)}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-body text-navy font-medium leading-tight">
                      {e.name as string}
                    </p>
                    {e.funktion && (
                      <p className="text-caption text-quiet">{e.funktion as string}</p>
                    )}
                  </div>
                </div>

                {e.bio && (
                  <p className="text-caption text-muted leading-relaxed line-clamp-3 mb-3">
                    {e.bio as string}
                  </p>
                )}

                {Array.isArray(e.expertise) && (e.expertise as string[]).length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {(e.expertise as string[]).slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-1.5 py-0.5 rounded-soft bg-bronze-soft text-bronze-ink text-[10px] font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-auto flex items-center justify-between pt-3 border-t border-stone">
                  <div>
                    <p className="text-caption text-quiet">Ab</p>
                    <p className="text-body-sm font-mono text-navy">
                      CHF {Number(e.honorar_chf_pro_stunde).toLocaleString('de-CH')}<span className="text-quiet">/h</span>
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-caption text-bronze-ink group-hover:text-bronze transition-colors">
                    Termin buchen
                    <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
    pending: { label: 'Bezahlung ausstehend', cls: 'bg-warn/15 text-warn', icon: Clock },
    paid: { label: 'Bezahlt', cls: 'bg-success/15 text-success', icon: CheckCircle2 },
    confirmed: { label: 'Bestätigt', cls: 'bg-success/15 text-success', icon: CheckCircle2 },
    cancelled: { label: 'Storniert', cls: 'bg-stone text-quiet', icon: XCircle },
  };
  const m = map[status] ?? map.pending;
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-caption font-medium ${m.cls}`}>
      <Icon className="w-3 h-3" strokeWidth={1.5} />
      {m.label}
    </span>
  );
}

function deriveInitials(name: string): string {
  return name.split(' ').map((s) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

function formatDateLong(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('de-CH', {
    weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
  }) + ', ' + d.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });
}
