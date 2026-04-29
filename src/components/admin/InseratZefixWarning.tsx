import { AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react';
import { checkZefixDiff } from '@/lib/admin/zefix-diff';
import { cn } from '@/lib/utils';

/**
 * Server-Component die im Hintergrund den Zefix-Check ausführt
 * und nur bei Abweichungen ein Warn-Banner rendert.
 *
 * Verwendung in der Admin-Inserat-Detail-Page.
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
  // Nur wenn UID hinterlegt ist, lohnt sich der Lookup
  if (!zefix_uid) {
    return (
      <div
        className="mb-3 inline-flex items-center gap-1.5 px-2 py-1 rounded-soft border border-stone bg-stone/30 text-[11px] text-quiet font-medium"
        title="Inserat ist nicht mit dem Schweizer Handelsregister verknüpft (keine UID hinterlegt). Identität nicht automatisch verifizierbar."
      >
        <ShieldAlert className="w-3 h-3" strokeWidth={1.5} />
        Nicht mit Handelsregister verknüpft
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

  if (diff.unverified) {
    const tooltip = diff.unverifiedReason ?? 'Handelsregister-Lookup fehlgeschlagen';
    return (
      <div
        className="mb-3 inline-flex items-center gap-1.5 px-2 py-1 rounded-soft border border-warn/30 bg-warn/10 text-[11px] text-warn font-medium"
        title={tooltip}
      >
        <AlertTriangle className="w-3 h-3" strokeWidth={1.5} />
        UID nicht im Handelsregister gefunden
      </div>
    );
  }

  // Keine Abweichungen → kompakter «verified»-Hinweis
  if (diff.entries.length === 0) {
    return (
      <div
        className="mb-3 inline-flex items-center gap-1.5 px-2 py-1 rounded-soft border border-success/30 bg-success/10 text-[11px] text-success font-medium"
        title={`Daten stimmen mit dem Handelsregister überein (Quelle: ${diff.source ?? 'lindas'}).`}
      >
        <ShieldCheck className="w-3 h-3" strokeWidth={1.5} />
        Mit Handelsregister abgeglichen
      </div>
    );
  }

  // Abweichungen vorhanden → grosses Warnbanner
  const tone =
    diff.topSeverity === 'critical'
      ? 'border-danger/40 bg-danger/10 text-danger'
      : diff.topSeverity === 'warning'
        ? 'border-warn/40 bg-warn/10 text-warn'
        : 'border-stone bg-stone/30 text-quiet';

  const headline =
    diff.topSeverity === 'critical'
      ? 'Kritische Abweichung zum Handelsregister'
      : diff.topSeverity === 'warning'
        ? 'Abweichungen zum Handelsregister'
        : 'Geringfügige Abweichungen zum Handelsregister';

  // Tooltip mit allen Diffs (Browsers wrappen das automatisch)
  const tooltip = diff.entries
    .map((e) => `[${e.severity.toUpperCase()}] ${e.label}: Inserat «${e.inserat ?? '—'}» vs. Handelsregister «${e.zefix ?? '—'}»\n→ ${e.hint}`)
    .join('\n\n');

  return (
    <div
      className={cn(
        'mb-3 rounded-soft border p-3',
        tone.replace('text-danger', '').replace('text-warn', '').replace('text-quiet', ''),
        tone,
      )}
      title={tooltip}
    >
      <div className="flex items-start gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
        <p className="text-[12px] font-semibold">{headline}</p>
      </div>
      <ul className="space-y-1 text-[11px] ml-6">
        {diff.entries.map((e) => (
          <li key={e.field} className="flex items-baseline gap-2">
            <span
              className={cn(
                'inline-flex items-center px-1 py-px rounded-soft font-mono text-[10px] font-medium uppercase tracking-wide',
                e.severity === 'critical'
                  ? 'bg-danger/20 text-danger'
                  : e.severity === 'warning'
                    ? 'bg-warn/20 text-warn'
                    : 'bg-stone/40 text-quiet',
              )}
            >
              {e.severity}
            </span>
            <span className="font-medium">{e.label}:</span>
            <span className="text-ink font-mono">«{e.inserat ?? '—'}»</span>
            <span className="text-quiet">↔</span>
            <span className="text-ink font-mono">«{e.zefix ?? '—'}»</span>
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-quiet mt-2 ml-6 italic">
        Quelle: {diff.source ?? 'Handelsregister'} · hover für Erklärung
      </p>
    </div>
  );
}
