import { AlertTriangle, ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react';
import { checkZefixDiff } from '@/lib/admin/zefix-diff';
import { cn } from '@/lib/utils';

/**
 * Server-Component die im Hintergrund den Zefix-Check ausführt.
 *
 * Cyrill 30.04.2026: «wenn jemand Information abändert oder das mit dem
 * Handelsregister nicht übereinstimmt, dass Du dort wirklich Alert anzeigt».
 *
 * Darum: Bei jeder Abweichung ein DEUTLICHES, ausgeklapptes Banner mit
 * Inserat-Wert ↔ HR-Wert direkt nebeneinander — nicht im Tooltip versteckt.
 */
export async function InseratZefixWarning({
  zefix_uid,
  firma_name,
  firma_rechtsform,
  firma_sitz_gemeinde,
  kanton,
  gruendungsjahr,
}: {
  zefix_uid: string | null;
  firma_name: string | null;
  firma_rechtsform: string | null;
  firma_sitz_gemeinde: string | null;
  kanton: string | null;
  gruendungsjahr: number | null;
}) {
  // Keine UID → grosses, sichtbares Hinweis-Banner (vorher: subtiles Badge)
  if (!zefix_uid) {
    return (
      <div className="mb-3 rounded-soft border border-warn/40 bg-warn/10 p-3 flex items-start gap-2.5">
        <ShieldQuestion
          className="w-4 h-4 mt-0.5 flex-shrink-0 text-warn"
          strokeWidth={1.5}
        />
        <div className="flex-1">
          <p className="text-[12px] font-semibold text-warn leading-snug">
            Inserat ohne Handelsregister-Verknüpfung
          </p>
          <p className="text-[11px] text-warn/85 mt-1 leading-relaxed">
            Es ist keine UID hinterlegt. Identität der Firma kann nicht
            automatisch verifiziert werden — manuell prüfen oder UID
            nachfordern bevor Freigabe.
          </p>
        </div>
      </div>
    );
  }

  let diff;
  try {
    diff = await checkZefixDiff({
      zefix_uid,
      firma_name,
      firma_rechtsform,
      firma_sitz_gemeinde,
      kanton,
      gruendungsjahr,
    });
  } catch {
    // Lookup-Fehler dürfen Page nicht crashen
    return null;
  }

  // UID war ungültig oder nicht im HR gefunden
  if (diff.unverified) {
    const reason = diff.unverifiedReason ?? 'Handelsregister-Lookup fehlgeschlagen';
    return (
      <div className="mb-3 rounded-soft border border-warn/40 bg-warn/10 p-3 flex items-start gap-2.5">
        <AlertTriangle
          className="w-4 h-4 mt-0.5 flex-shrink-0 text-warn"
          strokeWidth={1.5}
        />
        <div className="flex-1">
          <p className="text-[12px] font-semibold text-warn">
            UID nicht im Handelsregister gefunden
          </p>
          <p className="text-[11px] text-warn/85 mt-1 font-mono">{reason}</p>
        </div>
      </div>
    );
  }

  // Keine Abweichungen → kompaktes «verified»-Banner
  if (diff.entries.length === 0) {
    return (
      <div className="mb-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-soft border border-success/30 bg-success/10 text-[11px] text-success font-medium">
        <ShieldCheck className="w-3 h-3" strokeWidth={1.5} />
        Mit Handelsregister abgeglichen
        <span className="text-success/60 font-mono ml-1">
          ({diff.source ?? 'lindas'})
        </span>
      </div>
    );
  }

  // Abweichungen vorhanden → grosses Banner mit Inserat | HR direkt nebeneinander
  const tone =
    diff.topSeverity === 'critical'
      ? { border: 'border-danger/40', bg: 'bg-danger/10', text: 'text-danger', icon: AlertTriangle }
      : diff.topSeverity === 'warning'
        ? { border: 'border-warn/40', bg: 'bg-warn/10', text: 'text-warn', icon: AlertTriangle }
        : { border: 'border-stone', bg: 'bg-stone/30', text: 'text-quiet', icon: ShieldAlert };

  const headline =
    diff.topSeverity === 'critical'
      ? 'Kritische Abweichung zum Handelsregister'
      : diff.topSeverity === 'warning'
        ? 'Abweichungen zum Handelsregister'
        : 'Geringfügige Abweichungen zum Handelsregister';

  const Icon = tone.icon;

  return (
    <div className={cn('mb-3 rounded-soft border p-3', tone.border, tone.bg)}>
      <div className="flex items-start gap-2 mb-3">
        <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', tone.text)} strokeWidth={1.5} />
        <div className="flex-1">
          <p className={cn('text-[12px] font-semibold leading-snug', tone.text)}>{headline}</p>
          <p className="text-[11px] text-quiet mt-0.5">
            {diff.entries.length === 1
              ? '1 Feld abweichend'
              : `${diff.entries.length} Felder abweichend`}{' '}
            · Quelle: {diff.source ?? 'Handelsregister'}
          </p>
        </div>
      </div>

      <div className="border-t border-stone/60 pt-2">
        {/* Spalten-Header — nur ab sm sichtbar */}
        <div className="hidden sm:grid grid-cols-[140px_1fr_1fr_auto] gap-3 px-1 pb-1.5 text-[10px] uppercase tracking-wide font-medium text-quiet">
          <span>Feld</span>
          <span>Inserat</span>
          <span>Handelsregister</span>
          <span className="text-right">Stufe</span>
        </div>

        <ul className="divide-y divide-stone/60">
          {diff.entries.map((e) => (
            <li
              key={e.field}
              className="py-2 px-1 grid sm:grid-cols-[140px_1fr_1fr_auto] grid-cols-1 gap-x-3 gap-y-1 items-baseline"
            >
              <p className="text-[12px] font-medium text-ink">{e.label}</p>
              <p className="font-mono text-[12px] text-ink truncate" title={e.inserat ?? '(leer)'}>
                {e.inserat ? (
                  <span>«{e.inserat}»</span>
                ) : (
                  <em className="text-quiet not-italic">— fehlt</em>
                )}
              </p>
              <p className="font-mono text-[12px] text-ink truncate" title={e.zefix ?? '—'}>
                {e.zefix ? (
                  <span>«{e.zefix}»</span>
                ) : (
                  <em className="text-quiet not-italic">—</em>
                )}
              </p>
              <span
                className={cn(
                  'inline-flex items-center px-1.5 py-px rounded-soft font-mono text-[10px] font-medium uppercase tracking-wide justify-self-start sm:justify-self-end',
                  e.severity === 'critical'
                    ? 'bg-danger/20 text-danger'
                    : e.severity === 'warning'
                      ? 'bg-warn/20 text-warn'
                      : 'bg-stone/40 text-quiet',
                )}
              >
                {e.severity}
              </span>
              {/* Hint volle Breite unter der Reihe — Cyrill: «Alert anzeigen» */}
              <p className="sm:col-span-4 text-[11px] text-quiet leading-snug italic">
                {e.hint}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
