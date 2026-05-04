/**
 * Einheitliches Label für Mandate/Inserate im Broker-Bereich.
 *
 * Reihenfolge:
 *   1. titel  (vom Broker manuell gesetzt)
 *   2. firma_name (aus Zefix übernommen)
 *   3. Fallback "Mandat"
 *
 * Wird in `/dashboard/broker/mandate` und `/dashboard/broker/anfragen/[id]`
 * benutzt — vorher waren beide Stellen leicht inkonsistent (`titel ?? firma`
 * vs `firma ?? titel ?? 'Unbenanntes Mandat'`).
 */
export type MandatLabelInput = {
  titel?: string | null;
  firma_name?: string | null;
};

export function getMandatLabel(m: MandatLabelInput | null | undefined): string {
  if (!m) return 'Mandat';
  const titel = m.titel?.trim();
  if (titel) return titel;
  const firma = m.firma_name?.trim();
  if (firma) return firma;
  return 'Mandat';
}
