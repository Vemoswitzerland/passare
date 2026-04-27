// ════════════════════════════════════════════════════════════════════
// passare.ch — Email-HTML-Renderer (Deno-native, dependency-frei)
// ════════════════════════════════════════════════════════════════════
// Rendert die Templates aus emails/*.tsx als HTML-Strings.
// Bewusst Strings statt React-Render, weil:
//   - Edge Functions deployen isoliert (kein Zugriff auf src/emails/)
//   - Email-HTML muss Inline-Styles haben (Email-Clients ignorieren <style>)
//   - String-Render ist 10x schneller, hat keine Cold-Start-Kosten
// emails/*.tsx bleiben source of truth fürs Design + react-email dev preview.
// ════════════════════════════════════════════════════════════════════

const C = {
  ink:        '#0A0F12',
  navy:       '#0B1F3A',
  bronze:     '#B8935A',
  cream:      '#FAF8F3',
  paper:      '#FFFFFF',
  stone:      '#E8E6E0',
  quiet:      '#8A9099',
  muted:      '#5A6471',
};

const F = {
  serif: '"Fraunces", "Tiempos", Georgia, serif',
  sans:  '"Geist", "Inter", system-ui, -apple-system, sans-serif',
};

// ─── Helpers ─────────────────────────────────────────────────────
function esc(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function layout(opts: { preview: string; bodyHtml: string }): string {
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>passare</title>
<style>
  @media (max-width:600px){
    .container{width:100%!important;}
    .px{padding-left:20px!important;padding-right:20px!important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background:${C.cream};font-family:${F.sans};color:${C.ink};">
<div style="display:none;max-height:0;overflow:hidden;">${esc(opts.preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.cream};">
  <tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" class="container" width="560" cellpadding="0" cellspacing="0" border="0" style="background:${C.paper};max-width:560px;">
      <tr><td class="px" style="padding:32px 32px 16px 32px;">
        <div style="font-family:${F.serif};font-size:28px;font-weight:600;color:${C.navy};letter-spacing:-0.02em;">passare.</div>
      </td></tr>
      <tr><td style="border-top:0.5px solid ${C.stone};font-size:0;line-height:0;">&nbsp;</td></tr>
      <tr><td class="px" style="padding:32px;">${opts.bodyHtml}</td></tr>
      <tr><td style="border-top:0.5px solid ${C.stone};font-size:0;line-height:0;">&nbsp;</td></tr>
      <tr><td class="px" style="padding:24px 32px 32px 32px;">
        <p style="font-family:${F.sans};font-size:12px;color:${C.muted};margin:0 0 4px 0;">passare — Schweizer Marktplatz für Unternehmens­verkäufe</p>
        <p style="font-family:${F.sans};font-size:11px;color:${C.quiet};margin:0 0 4px 0;">Vemo Switzerland · Zürich, Schweiz</p>
        <p style="font-family:${F.sans};font-size:11px;color:${C.quiet};margin:0;">
          <a href="https://passare.ch/impressum" style="color:${C.quiet};text-decoration:underline;">Impressum</a> ·
          <a href="https://passare.ch/datenschutz" style="color:${C.quiet};text-decoration:underline;">Datenschutz</a> ·
          <a href="https://passare.ch/agb" style="color:${C.quiet};text-decoration:underline;">AGB</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

const H = (txt: string) =>
  `<h1 style="font-family:${F.serif};font-size:24px;line-height:1.25;letter-spacing:-0.01em;color:${C.ink};margin:0 0 16px 0;font-weight:500;">${esc(txt)}</h1>`;

const P = (html: string) =>
  `<p style="font-family:${F.sans};font-size:15px;line-height:1.6;color:${C.ink};margin:0 0 16px 0;">${html}</p>`;

const Cap = (txt: string) =>
  `<p style="font-family:${F.sans};font-size:13px;line-height:1.5;color:${C.muted};margin:16px 0 0 0;">${esc(txt)}</p>`;

const Btn = (href: string, label: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;"><tr><td style="background:${C.navy};border-radius:2px;"><a href="${esc(href)}" style="display:inline-block;padding:14px 28px;font-family:${F.sans};font-size:14px;font-weight:500;letter-spacing:0.02em;color:${C.paper};text-decoration:none;">${esc(label)}</a></td></tr></table>`;

const Box = (innerHtml: string) =>
  `<div style="background:${C.cream};border:0.5px solid ${C.stone};padding:20px 24px;margin:20px 0;">${innerHtml}</div>`;

const Meta = (label: string, value: string) =>
  `<p style="font-family:${F.sans};font-size:14px;line-height:1.6;color:${C.ink};margin:0 0 6px 0;"><strong>${esc(label)}:</strong> ${esc(value)}</p>`;

// ─── Templates ───────────────────────────────────────────────────
type Vars = Record<string, unknown>;

function v(vars: Vars, key: string, fallback = ''): string {
  const val = vars[key];
  return val === undefined || val === null ? fallback : String(val);
}

function vNum(vars: Vars, key: string): number | undefined {
  const val = vars[key];
  return typeof val === 'number' ? val : undefined;
}

function tplWelcome(vars: Vars) {
  const name = v(vars, 'name');
  const appUrl = v(vars, 'appUrl', 'https://passare.ch');
  const greeting = name ? `Hallo ${esc(name)}` : 'Willkommen';
  const body = [
    H(`${greeting.replace(/&[^;]+;/g, m => m === '&amp;' ? '&' : m)} bei passare.`),
    P('Schön, dass du an Bord bist. passare verbindet Schweizer KMU-Inhaberinnen und -Inhaber mit qualifizierten, geprüften Käuferinnen und Käufern — diskret und kuratiert.'),
    P('Als Nächstes: Konto einrichten, Rolle wählen (verkaufen oder kaufen) und das Profil vervollständigen. Das dauert keine fünf Minuten.'),
    Btn(`${appUrl}/dashboard`, 'Zum Dashboard'),
    Cap('Fragen? Antworte einfach auf diese Email — wir lesen jede persönlich.'),
  ].join('');
  return {
    subject: 'Willkommen bei passare',
    html: layout({ preview: 'Willkommen bei passare — dein Schweizer Marktplatz für Unternehmensverkäufe.', bodyHtml: body }),
  };
}

function tplVerifizierung(vars: Vars) {
  const name = v(vars, 'name');
  const verifyUrl = v(vars, 'verifyUrl');
  const body = [
    H(`${name ? esc(name) + ', bitte' : 'Bitte'} bestätige deine Email.`),
    P('Ein Klick auf den Knopf unten und dein Konto bei passare ist aktiviert. Der Link ist 24 Stunden gültig.'),
    Btn(verifyUrl, 'Email bestätigen'),
    Box(P('Funktioniert der Knopf nicht? Kopier den Link in deinen Browser:') +
        `<p style="font-family:${F.sans};font-size:13px;line-height:1.5;color:${C.muted};margin:0;word-break:break-all;">${esc(verifyUrl)}</p>`),
    Cap('Du hast dich nicht registriert? Dann kannst du diese Email einfach ignorieren — ohne Bestätigung wird kein Konto angelegt.'),
  ].join('');
  return {
    subject: 'Bestätige deine Email — passare',
    html: layout({ preview: 'Bestätige deine Email-Adresse bei passare.', bodyHtml: body }),
  };
}

function tplPasswortReset(vars: Vars) {
  const name = v(vars, 'name');
  const resetUrl = v(vars, 'resetUrl');
  const body = [
    H('Passwort zurücksetzen'),
    P(`${name ? 'Hallo ' + esc(name) + ', du' : 'Du'} hast ein neues Passwort für dein passare-Konto angefordert. Klick den Knopf, um eines zu vergeben — der Link ist eine Stunde gültig.`),
    Btn(resetUrl, 'Neues Passwort setzen'),
    Box(P('Link funktioniert nicht? In den Browser kopieren:') +
        `<p style="font-family:${F.sans};font-size:13px;line-height:1.5;color:${C.muted};margin:0;word-break:break-all;">${esc(resetUrl)}</p>`),
    Cap('Wenn du das nicht warst: Ignoriere diese Email. Dein Passwort bleibt unverändert.'),
  ].join('');
  return {
    subject: 'Passwort zurücksetzen — passare',
    html: layout({ preview: 'Setze dein passare-Passwort zurück.', bodyHtml: body }),
  };
}

function tplAnfrageEingegangen(vars: Vars) {
  const verkaeufer = v(vars, 'verkaeuferName');
  const titel = v(vars, 'inseratTitel', 'dein Inserat');
  const kaeuferTyp = v(vars, 'kaeuferTyp');
  const budget = v(vars, 'budgetRange');
  const timing = v(vars, 'timing');
  const snippet = v(vars, 'nachrichtSnippet');
  const appUrl = v(vars, 'appUrl', 'https://passare.ch');
  const anfrageId = v(vars, 'anfrageId', '');

  const boxBits = [
    kaeuferTyp ? Meta('Käufer-Typ', kaeuferTyp) : '',
    budget ? Meta('Budget', budget) : '',
    timing ? Meta('Timing', timing) : '',
    snippet ? `<p style="font-family:${F.sans};font-size:14px;font-style:italic;color:${C.ink};margin:12px 0 0 0;">«${esc(snippet)}»</p>` : '',
  ].join('');

  const body = [
    H('Neue Anfrage zu deinem Inserat'),
    P(`${verkaeufer ? esc(verkaeufer) + ', ein' : 'Ein'} qualifizierter Käufer hat Interesse an deinem Inserat <strong>${esc(titel)}</strong> bekundet.`),
    boxBits ? Box(boxBits) : '',
    P('Antworte rasch — Käufer schätzen Reaktionsgeschwindigkeit. Deine durchschnittliche Antwortzeit fliesst in deinen Qualitätsscore ein.'),
    Btn(`${appUrl}/dashboard/anfragen/${anfrageId}`, 'Anfrage öffnen'),
    Cap('Diese Email kannst du in deinen Konto-Einstellungen abbestellen — wir empfehlen es aber nicht, weil zeitnahe Antworten dein Profil aufwerten.'),
  ].join('');

  return {
    subject: `Neue Anfrage: ${titel}`,
    html: layout({ preview: `Neue Anfrage zu: ${titel}`, bodyHtml: body }),
  };
}

function tplAnfrageBeantwortet(vars: Vars) {
  const kaeufer = v(vars, 'kaeuferName');
  const titel = v(vars, 'inseratTitel', 'dein Inserat');
  const kuerzel = v(vars, 'verkaeuferKuerzel');
  const snippet = v(vars, 'antwortSnippet');
  const appUrl = v(vars, 'appUrl', 'https://passare.ch');
  const anfrageId = v(vars, 'anfrageId', '');

  const body = [
    H('Du hast eine Antwort erhalten'),
    P(`${kaeufer ? esc(kaeufer) + ', der' : 'Der'} Verkäufer${kuerzel ? ' (' + esc(kuerzel) + ')' : ''} hat auf deine Anfrage zu <strong>${esc(titel)}</strong> reagiert.`),
    snippet ? Box(`<p style="font-family:${F.serif};font-size:16px;line-height:1.55;font-style:italic;color:${C.ink};margin:0;">«${esc(snippet)}»</p>`) : '',
    P('Lies die vollständige Antwort im Dashboard und reagiere direkt aus dem Anfrage-Faden. Sensible Details werden erst nach NDA-Unterzeichnung freigegeben.'),
    Btn(`${appUrl}/dashboard/anfragen/${anfrageId}`, 'Antwort öffnen'),
    Cap('Tipp: Aktiviere passare MAX um Anfragen mit Priorität zu stellen und früher Antworten zu erhalten.'),
  ].join('');

  return {
    subject: `Antwort: ${titel}`,
    html: layout({ preview: `Antwort zu deiner Anfrage: ${titel}`, bodyHtml: body }),
  };
}

function tplNDASigniert(vars: Vars) {
  const verkaeufer = v(vars, 'verkaeuferName');
  const titel = v(vars, 'inseratTitel', 'dein Inserat');
  const kuerzel = v(vars, 'kaeuferKuerzel');
  const signiertAm = v(vars, 'signiertAm');
  const appUrl = v(vars, 'appUrl', 'https://passare.ch');
  const inseratId = v(vars, 'inseratId', '');

  const boxBits = [
    Meta('Inserat', titel),
    signiertAm ? Meta('Signiert am', signiertAm) : '',
    kuerzel ? Meta('Käufer-Kennzeichen', kuerzel) : '',
  ].join('');

  const body = [
    H('NDA wurde unterzeichnet'),
    P(`${verkaeufer ? esc(verkaeufer) + ', ein' : 'Ein'} Käufer${kuerzel ? ' (' + esc(kuerzel) + ')' : ''} hat das Geheimhaltungs-Dokument zu deinem Inserat <strong>${esc(titel)}</strong> unterzeichnet.`),
    Box(boxBits),
    P('Der Datenraum ist für diesen Käufer jetzt freigegeben. Du kannst die NDA-Unterschrift als PDF aus dem Dashboard exportieren — rechtsgültig dank qualifizierter elektronischer Signatur (QES).'),
    Btn(`${appUrl}/dashboard/inserate/${inseratId}/datenraum`, 'Datenraum öffnen'),
    Cap('Das NDA-Dokument liegt rechtskonform unterzeichnet bei uns. Wir archivieren Signaturen 10 Jahre gemäss OR.'),
  ].join('');

  return {
    subject: `NDA unterzeichnet: ${titel}`,
    html: layout({ preview: `NDA unterzeichnet: ${titel}`, bodyHtml: body }),
  };
}

function tplAlertNeuesInserat(vars: Vars) {
  const kaeufer = v(vars, 'kaeuferName');
  const titel = v(vars, 'inseratTitel', 'Neues Inserat');
  const branche = v(vars, 'branche');
  const kanton = v(vars, 'kanton');
  const preis = v(vars, 'preisBand');
  const ebitda = v(vars, 'ebitda');
  const score = vNum(vars, 'matchScore');
  const profilName = v(vars, 'suchprofilName');
  const appUrl = v(vars, 'appUrl', 'https://passare.ch');
  const inseratId = v(vars, 'inseratId', '');

  const boxBits = [
    `<p style="font-family:${F.serif};font-size:18px;line-height:1.3;color:${C.navy};margin:0 0 12px 0;font-weight:500;">${esc(titel)}</p>`,
    branche ? Meta('Branche', branche) : '',
    kanton ? Meta('Kanton', kanton) : '',
    preis ? Meta('Preisband', preis) : '',
    ebitda ? Meta('EBITDA', ebitda) : '',
    score !== undefined ? `<p style="font-family:${F.sans};font-size:14px;color:${C.bronze};margin:8px 0 0 0;"><strong>Match-Score:</strong> ${score} / 100</p>` : '',
  ].join('');

  const body = [
    H('Neues Inserat passt zu deinem Profil'),
    P(`${kaeufer ? esc(kaeufer) + ', ein' : 'Ein'} neues Inserat${profilName ? ' matcht dein Suchprofil «' + esc(profilName) + '»' : ' passt zu deinen Suchkriterien'}.${score !== undefined && score >= 80 ? ' Das ist ein starker Match.' : ''}`),
    Box(boxBits),
    Btn(`${appUrl}/inserate/${inseratId}`, 'Inserat ansehen'),
    Cap('Du erhältst diese Email weil passare MAX aktiv ist. Häufigkeit und Schwellenwerte kannst du im Dashboard unter «Suchprofile» justieren.'),
  ].join('');

  return {
    subject: `Match: ${titel}`,
    html: layout({ preview: `Neuer Match für dein Suchprofil: ${titel}`, bodyHtml: body }),
  };
}

function tplZahlungBestaetigung(vars: Vars) {
  const empf = v(vars, 'empfaengerName');
  const produkt = v(vars, 'produkt', 'passare-Produkt');
  const betrag = v(vars, 'betrag');
  const rechnungsNr = v(vars, 'rechnungsNr');
  const rechnungsUrl = v(vars, 'rechnungsUrl');
  const datum = v(vars, 'zahlungsdatum');
  const appUrl = v(vars, 'appUrl', 'https://passare.ch');

  const boxBits = [
    Meta('Produkt', produkt),
    betrag ? Meta('Betrag', betrag) : '',
    datum ? Meta('Datum', datum) : '',
    rechnungsNr ? Meta('Rechnungs-Nr.', rechnungsNr) : '',
  ].join('');

  const body = [
    H('Zahlung erfolgreich'),
    P(`${empf ? esc(empf) + ', vielen' : 'Vielen'} Dank für deine Zahlung. Sie wurde erfolgreich verbucht.`),
    Box(boxBits),
    rechnungsUrl ? Btn(rechnungsUrl, 'Rechnung herunterladen') : Btn(`${appUrl}/dashboard`, 'Zum Dashboard'),
    P('Dein Inserat / Abo ist ab sofort aktiv. Im Dashboard siehst du Status, Restlaufzeit und kannst alle Rechnungen zentral abrufen.'),
    Cap('Stripe verarbeitet alle Zahlungen — wir sehen keine Karten- oder Kontodaten. Bei Fragen zur Rechnung: einfach auf diese Email antworten.'),
  ].join('');

  return {
    subject: `Zahlung bestätigt — ${produkt}`,
    html: layout({ preview: `Zahlung bestätigt: ${produkt}${betrag ? ' — ' + betrag : ''}`, bodyHtml: body }),
  };
}

function tplInseratBaldAbgelaufen(vars: Vars) {
  const verkaeufer = v(vars, 'verkaeuferName');
  const titel = v(vars, 'inseratTitel', 'dein Inserat');
  const abgelaufenAm = v(vars, 'abgelaufenAm');
  const tage = vNum(vars, 'tageVerbleibend') ?? 14;
  const anfragen = vNum(vars, 'anzahlAnfragen');
  const views = vNum(vars, 'views');
  const appUrl = v(vars, 'appUrl', 'https://passare.ch');
  const inseratId = v(vars, 'inseratId', '');

  const boxBits = [
    views !== undefined ? Meta('Aufrufe bisher', String(views)) : '',
    anfragen !== undefined ? Meta('Anfragen', String(anfragen)) : '',
  ].join('');

  const body = [
    H('Dein Inserat läuft bald ab'),
    P(`${verkaeufer ? esc(verkaeufer) + ', dein' : 'Dein'} Inserat <strong>${esc(titel)}</strong> ist nur noch <strong>${tage} Tage</strong> sichtbar${abgelaufenAm ? ' — bis am ' + esc(abgelaufenAm) : ''}.`),
    boxBits ? Box(boxBits) : '',
    P('Verlängere jetzt um weitere 90 Tage — die meisten Verkäufe brauchen 4–9 Monate bis zum Abschluss. Beim ersten Verlängern gibt\'s keinen Aufpreis fürs nochmalige Listing-Setup.'),
    Btn(`${appUrl}/dashboard/inserate/${inseratId}/verlaengern`, 'Inserat verlängern'),
    Cap('Nach Ablauf bleibt dein Inserat 30 Tage als Entwurf gespeichert. Eingegangene Anfragen kannst du dauerhaft im Dashboard abrufen.'),
  ].join('');

  return {
    subject: `Inserat läuft in ${tage} Tagen ab`,
    html: layout({ preview: `Dein Inserat läuft in ${tage} Tagen ab — verlängern?`, bodyHtml: body }),
  };
}

// ─── Public API ──────────────────────────────────────────────────
export type RenderedEmail = { subject: string; html: string };

export function renderEmail(template: string, vars: Vars): RenderedEmail {
  switch (template) {
    case 'welcome':                 return tplWelcome(vars);
    case 'verifizierung':           return tplVerifizierung(vars);
    case 'passwort_reset':          return tplPasswortReset(vars);
    case 'anfrage_eingegangen':     return tplAnfrageEingegangen(vars);
    case 'anfrage_beantwortet':     return tplAnfrageBeantwortet(vars);
    case 'nda_signiert':            return tplNDASigniert(vars);
    case 'alert_neues_inserat':     return tplAlertNeuesInserat(vars);
    case 'zahlung_bestaetigung':    return tplZahlungBestaetigung(vars);
    case 'inserat_bald_abgelaufen': return tplInseratBaldAbgelaufen(vars);
    default:
      throw new Error(`Unbekanntes Email-Template: ${template}`);
  }
}

export const KNOWN_TEMPLATES = [
  'welcome',
  'verifizierung',
  'passwort_reset',
  'anfrage_eingegangen',
  'anfrage_beantwortet',
  'nda_signiert',
  'alert_neues_inserat',
  'zahlung_bestaetigung',
  'inserat_bald_abgelaufen',
] as const;
