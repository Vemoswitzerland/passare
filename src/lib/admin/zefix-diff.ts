/**
 * Zefix-Sicherheits-Check für Inserate.
 *
 * Vergleicht die im Inserat eingetragenen Firma-Stammdaten mit dem
 * offiziellen Schweizer Handelsregister (LINDAS / Zefix REST).
 * Liefert eine Liste von Abweichungen mit Severity-Level für die
 * Admin-UI (Warnsymbol mit Tooltip).
 */

import { lookupByUid, type ZefixCompany } from '@/lib/zefix';

export type DiffSeverity = 'info' | 'warning' | 'critical';

export type ZefixDiffEntry = {
  field: 'firma_name' | 'firma_rechtsform' | 'firma_sitz_gemeinde' | 'gruendungsjahr' | 'kanton' | 'status_active';
  label: string;
  inserat: string | null;
  zefix: string | null;
  severity: DiffSeverity;
  hint: string;
};

export type ZefixDiffResult = {
  /** UID war ungültig oder Lookup fehlgeschlagen — keine Verifikation möglich */
  unverified: boolean;
  unverifiedReason?: string;
  /** Falls Firma im Handelsregister gelöscht/inaktiv */
  inactive: boolean;
  /** Liste aller gefundenen Abweichungen */
  entries: ZefixDiffEntry[];
  /** Höchste Severity über alle entries */
  topSeverity: DiffSeverity | null;
  /** Quelle (lindas/rest/cache) */
  source: ZefixCompany['source'] | null;
};

/** Normalisierter String-Vergleich: case-insensitive, trim, ohne Sonderzeichen. */
function looseEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  const norm = (s: string | null | undefined) =>
    (s ?? '')
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '') // Akzente weg
      .replace(/[^a-z0-9]+/g, '') // alle Sonderzeichen weg
      .trim();
  return norm(a) === norm(b);
}

function rechtsformLooseEqual(a: string | null, b: string | null): boolean {
  // Rechtsformen kommen in vielen Schreibweisen: "AG", "Aktiengesellschaft", "Société Anonyme"
  // Wir bauen ein paar Aliases.
  const norm = (s: string | null | undefined) =>
    (s ?? '')
      .toLowerCase()
      .replace(/[.\s,]/g, '')
      .replace('aktiengesellschaft', 'ag')
      .replace('societeanonyme', 'ag')
      .replace('sa', 'ag')
      .replace('societaanonima', 'ag')
      .replace('gesellschaftmitbeschraenkterhaftung', 'gmbh')
      .replace('sarl', 'gmbh')
      .replace('sagl', 'gmbh')
      .replace('einzelunternehmen', 'eu')
      .replace('kollektivgesellschaft', 'kg')
      .replace('kommanditgesellschaft', 'kommg');
  return norm(a) === norm(b);
}

/**
 * Vergleicht Inserat-Firma-Stammdaten mit Zefix-Daten.
 * Wenn `zefix_uid` fehlt oder ungültig → unverified=true (keine Warnung).
 *
 * Rule of thumb für severity:
 *  - critical: Inserat sagt firma X, Zefix sagt Firma Y — Identitätsmischung
 *  - critical: Firma im HR gelöscht / inaktiv
 *  - warning: Rechtsform / Gemeinde abweichend (kann durch Umzug etc. erklärbar sein)
 *  - info: Gründungsjahr ±1 Jahr Abweichung (Erfassung kann variieren)
 */
export async function checkZefixDiff(input: {
  zefix_uid: string | null;
  firma_name: string | null;
  firma_rechtsform: string | null;
  firma_sitz_gemeinde: string | null;
  kanton: string | null;
  gruendungsjahr: number | null;
}): Promise<ZefixDiffResult> {
  if (!input.zefix_uid) {
    return {
      unverified: true,
      unverifiedReason: 'Kein UID hinterlegt — Inserat nicht mit Handelsregister verknüpft.',
      inactive: false,
      entries: [],
      topSeverity: null,
      source: null,
    };
  }

  let zefix: ZefixCompany | null = null;
  try {
    zefix = await lookupByUid(input.zefix_uid);
  } catch {
    /* fallthrough */
  }

  if (!zefix) {
    return {
      unverified: true,
      unverifiedReason: `Zu UID ${input.zefix_uid} wurde kein Eintrag im Handelsregister gefunden.`,
      inactive: false,
      entries: [],
      topSeverity: null,
      source: null,
    };
  }

  const entries: ZefixDiffEntry[] = [];

  // Firma-Status (gelöscht / aktiv)
  if (zefix.statusActive === false) {
    entries.push({
      field: 'status_active',
      label: 'Firma-Status',
      inserat: 'aktiv (Inserat)',
      zefix: zefix.status ?? 'gelöscht/inaktiv',
      severity: 'critical',
      hint: 'Diese Firma ist im Handelsregister nicht mehr aktiv. Inserat sollte vor Freigabe geprüft werden.',
    });
  }

  // Firmenname
  if (input.firma_name && zefix.name && !looseEqual(input.firma_name, zefix.name)) {
    entries.push({
      field: 'firma_name',
      label: 'Firmenname',
      inserat: input.firma_name,
      zefix: zefix.name,
      severity: 'critical',
      hint: 'Der Firmenname im Inserat weicht stark vom Handelsregister ab. Möglicher Identitäts-Konflikt.',
    });
  }

  // Rechtsform
  if (
    input.firma_rechtsform &&
    zefix.rechtsform &&
    !rechtsformLooseEqual(input.firma_rechtsform, zefix.rechtsform)
  ) {
    entries.push({
      field: 'firma_rechtsform',
      label: 'Rechtsform',
      inserat: input.firma_rechtsform,
      zefix: zefix.rechtsform,
      severity: 'warning',
      hint: 'Rechtsform-Bezeichnung im Inserat weicht von Handelsregister ab.',
    });
  }

  // Sitz-Gemeinde
  if (
    input.firma_sitz_gemeinde &&
    zefix.gemeinde &&
    !looseEqual(input.firma_sitz_gemeinde, zefix.gemeinde)
  ) {
    entries.push({
      field: 'firma_sitz_gemeinde',
      label: 'Sitz-Gemeinde',
      inserat: input.firma_sitz_gemeinde,
      zefix: zefix.gemeinde,
      severity: 'warning',
      hint: 'Gemeinde-Sitz im Inserat weicht von Handelsregister ab — evtl. Umzug oder Tippfehler.',
    });
  }

  // Kanton
  if (input.kanton && zefix.kanton && input.kanton.toUpperCase() !== zefix.kanton.toUpperCase()) {
    entries.push({
      field: 'kanton',
      label: 'Kanton',
      inserat: input.kanton,
      zefix: zefix.kanton,
      severity: 'warning',
      hint: 'Kanton im Inserat weicht von Handelsregister ab.',
    });
  }

  // Gründungsjahr — Cyrill 30.04.2026: manuell eingetragene Werte wurden
  // letztes Mal nicht sauber aus dem HR übernommen. Wir prüfen hier explizit
  // drei Fälle: (a) Inserat leer + HR hat Wert → "fehlt, übernimmst du den
  // HR-Wert?" (b) Beide gesetzt + Diff → wie bisher. (c) Inserat hat Wert,
  // HR liefert keinen → kein Eintrag (HR ist nicht autoritativ für jedes
  // Gründungsjahr, vor allem bei Einzelfirmen).
  if (zefix.gruendungsjahr && !input.gruendungsjahr) {
    entries.push({
      field: 'gruendungsjahr',
      label: 'Gründungsjahr',
      inserat: null,
      zefix: zefix.gruendungsjahr.toString(),
      severity: 'warning',
      hint:
        'Im Inserat fehlt das Gründungsjahr — laut Handelsregister ist es ' +
        `${zefix.gruendungsjahr}. Wert übernehmen.`,
    });
  } else if (input.gruendungsjahr && zefix.gruendungsjahr) {
    const diff = Math.abs(input.gruendungsjahr - zefix.gruendungsjahr);
    if (diff > 0) {
      entries.push({
        field: 'gruendungsjahr',
        label: 'Gründungsjahr',
        inserat: input.gruendungsjahr.toString(),
        zefix: zefix.gruendungsjahr.toString(),
        severity: diff > 5 ? 'critical' : diff > 1 ? 'warning' : 'info',
        hint:
          diff > 5
            ? `Gründungsjahr-Abweichung von ${diff} Jahren — auffällig.`
            : `Gründungsjahr weicht um ${diff} Jahr(e) ab.`,
      });
    }
  }

  // Firmenname — auch wenn Inserat leer aber HR Wert hat
  if (zefix.name && !input.firma_name) {
    entries.push({
      field: 'firma_name',
      label: 'Firmenname',
      inserat: null,
      zefix: zefix.name,
      severity: 'warning',
      hint: `Firmenname fehlt im Inserat — Handelsregister: «${zefix.name}».`,
    });
  }

  // Rechtsform — auch wenn Inserat leer aber HR Wert hat
  if (zefix.rechtsform && !input.firma_rechtsform) {
    entries.push({
      field: 'firma_rechtsform',
      label: 'Rechtsform',
      inserat: null,
      zefix: zefix.rechtsform,
      severity: 'warning',
      hint: `Rechtsform fehlt im Inserat — Handelsregister: «${zefix.rechtsform}».`,
    });
  }

  // Sitz-Gemeinde — auch wenn Inserat leer aber HR Wert hat
  if (zefix.gemeinde && !input.firma_sitz_gemeinde) {
    entries.push({
      field: 'firma_sitz_gemeinde',
      label: 'Sitz-Gemeinde',
      inserat: null,
      zefix: zefix.gemeinde,
      severity: 'warning',
      hint: `Sitz-Gemeinde fehlt im Inserat — Handelsregister: «${zefix.gemeinde}».`,
    });
  }

  // Top-Severity ableiten
  const order: DiffSeverity[] = ['info', 'warning', 'critical'];
  const top = entries.reduce<DiffSeverity | null>((max, e) => {
    if (max == null) return e.severity;
    return order.indexOf(e.severity) > order.indexOf(max) ? e.severity : max;
  }, null);

  return {
    unverified: false,
    inactive: zefix.statusActive === false,
    entries,
    topSeverity: top,
    source: zefix.source,
  };
}
