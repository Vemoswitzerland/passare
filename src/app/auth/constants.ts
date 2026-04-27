// Aktuelle AGB- und Datenschutz-Versionen (bei Updates hier hochzählen)
export const AGB_VERSION = '2026-04';
export const DATENSCHUTZ_VERSION = '2026-04';

// 26 CH-Kantone (Code, Label DE)
export const KANTONE = [
  ['ZH', 'Zürich'], ['BE', 'Bern'], ['LU', 'Luzern'], ['UR', 'Uri'],
  ['SZ', 'Schwyz'], ['OW', 'Obwalden'], ['NW', 'Nidwalden'], ['GL', 'Glarus'],
  ['ZG', 'Zug'], ['FR', 'Freiburg'], ['SO', 'Solothurn'], ['BS', 'Basel-Stadt'],
  ['BL', 'Basel-Landschaft'], ['SH', 'Schaffhausen'], ['AR', 'Appenzell A.Rh.'],
  ['AI', 'Appenzell I.Rh.'], ['SG', 'St. Gallen'], ['GR', 'Graubünden'],
  ['AG', 'Aargau'], ['TG', 'Thurgau'], ['TI', 'Tessin'], ['VD', 'Waadt'],
  ['VS', 'Wallis'], ['NE', 'Neuenburg'], ['GE', 'Genf'], ['JU', 'Jura'],
] as const;

export type ActionResult = { ok: true } | { ok: false; error: string };
