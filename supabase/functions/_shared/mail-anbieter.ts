// ════════════════════════════════════════════════════════════════════
// _shared/mail-anbieter.ts — DIE EINE DATEI, DIE DEN MAIL-ANBIETER KENNT
// ────────────────────────────────────────────────────────────────────
// Umzug Resend -> Lettermint (Plan C5, 29.09.2026). passare verschickt
// Mails an genau zwei Stellen:
//   1. Edge Function `send-email` (Deno, Supabase)  — alle Vorlagen-Mails
//   2. Server-Action `src/app/verkaufen/start/actions.ts` (Node, Vercel)
//      — die Smart-Bewertung per Mail
// Beide senden über DIESE Datei. Nur hier stehen die Adresse des Anbieters,
// der Name seiner Schlüssel-Kopfzeile und der Name des Schlüssels
// (`MAIL_API_TOKEN`). Wer den Anbieter wechselt, wechselt diese Datei.
// Die Wand `mail-anbieter.test.ts` hält das fest (grep über das ganze Repo).
//
// Die Datei hat keine Importe und keine Deno- oder Node-Typen, damit sie in
// beiden Laufzeiten gleich übersetzt wird (Deno: `deno check`, Next: `tsc`).
//
// QUELLE (Lettermint Sende-Schema, SendMailRequest; docs/platform/emails/idempotency):
//   - POST https://api.lettermint.co/v1/send, Schlüssel in `x-lettermint-token`
//   - Doppelversand-Schutz über die Kopfzeile `Idempotency-Key` (24 h je Projekt)
//   - Antwort 202 `{ message_id, status }`; Abweisung 4xx `{ message, errors }`
//
// GEMESSEN IN DEN PROBEN (lettermint-umzug/ZETTEL-L0b.md, 26./27.09.2026):
//   - T2: zwei GLEICHZEITIGE Anfragen mit demselben `Idempotency-Key` ergaben
//     3 von 3 Mal ZWEI Mails. Der Schutz gegen Gleichzeitigkeit ist darum NICHT
//     hier, sondern die eigene Versand-Sperre in `send-email` (Datenbank-
//     Funktion `email_log_versand_beanspruchen`, Wand `send-email/versand.test.ts`).
//   - T2: gleicher Schlüssel mit anderem Inhalt -> 409 nur mit `{ message }`.
//   - T6: Lettermint führt einen Status je Nachricht, die Ereignisse aber je
//     Empfänger. passare schickt jede Mail an GENAU EINEN Empfänger (kein cc,
//     kein bcc); `sendeBeimAnbieter` erzwingt das, damit ein Zeilen-Status in
//     `email_log` immer genau diesem einen Empfänger gehört.
//
// WAS DIESE DATEI NICHT ENTSCHEIDET: ob eine Antwort Erfolg, Nein oder
// «unklar» ist. Hier wird nur gesendet und gelesen, was zurückkam.
// ════════════════════════════════════════════════════════════════════

/** Der Rechner des Anbieters. */
export const ANBIETER_HOST = 'api.lettermint.co';

/** Die eine Adresse, an die gesendet wird. */
export const ANBIETER_ENDPOINT = `https://${ANBIETER_HOST}/v1/send`;

/** Die Kopfzeile mit dem Projekt-Schlüssel (Sende-Schema, `x-lettermint-token`). */
const SCHLUESSEL_KOPF = 'x-lettermint-token';

/** Wie lange ein Versand höchstens auf die Antwort wartet. */
const SENDE_FRIST_MS = 30_000;

type Umgebung = {
  Deno?: { env: { get(name: string): string | undefined } };
  process?: { env: Record<string, string | undefined> };
};

/**
 * DIE EINE LESESTELLE des Schlüssels, für beide Laufzeiten: Deno (Supabase
 * Edge Function) liest `Deno.env`, Node (Vercel) `process.env`. Liest bei
 * jedem Ruf neu (Tests setzen und entfernen ihn).
 */
function schluessel(): string {
  const u = globalThis as unknown as Umgebung;
  const wert = u.Deno ? u.Deno.env.get('MAIL_API_TOKEN') : u.process?.env.MAIL_API_TOKEN;
  return (wert ?? '').trim();
}

/** Ist ein Schlüssel eingerichtet? Die eine Frage vor jedem Versand. */
export function mailBereit(): boolean {
  return schluessel() !== '';
}

/** Die Mail, wie sie an den Anbieter geht (Namen des Sende-Schemas). */
export interface AnbieterMail {
  from: string;
  /** Genau EIN Empfänger (siehe Kopf, T6). */
  to: [string];
  reply_to?: string[];
  subject: string;
  html: string;
  text?: string;
}

/** Was vom Anbieter zurückkam: reine Transport-Daten, keine Deutung. */
export interface AnbieterAntwort {
  /** HTTP-Status der Antwort. */
  http: number;
  /** `message_id` aus der Antwort, sonst null (auch bei 202 möglich). */
  messageId: string | null;
  /** Der rohe Körper (höchstens 1'000 Zeichen), für den Grund, den ein Mensch liest. */
  koerper: string;
}

/**
 * Sendet EINE Mail beim Anbieter.
 *
 * @param idempotencyKey  Kennung dieser einen Mail (send-email: `email_log.id`).
 *   `null` nur, wo es keinen zweiten Versuch derselben Mail gibt (ein Klick =
 *   eine Mail, siehe actions.ts). Er schützt nur gegen Wiederholungen
 *   NACHEINANDER; gegen gleichzeitige Versuche schützt er nicht (T2).
 *
 * Wirft, wenn keine Antwort kam (Netz, Frist, Umleitung): dann kann der
 * Anbieter die Mail trotzdem angenommen haben; das ordnet der Rufer ein.
 * `redirect: 'error'`: mit einer Umleitung ginge der Schlüssel an einen
 * Rechner, den wir nicht gewählt haben.
 */
export async function sendeBeimAnbieter(
  mail: AnbieterMail,
  idempotencyKey: string | null,
): Promise<AnbieterAntwort> {
  if (!Array.isArray(mail.to) || mail.to.length !== 1 || !mail.to[0]) {
    throw new Error('sendeBeimAnbieter: genau ein Empfänger (to) verlangt, nichts gesendet');
  }
  const kopf: Record<string, string> = {
    [SCHLUESSEL_KOPF]: schluessel(),
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  if (idempotencyKey !== null) kopf['Idempotency-Key'] = idempotencyKey;
  const res = await fetch(ANBIETER_ENDPOINT, {
    method: 'POST',
    redirect: 'error',
    signal: AbortSignal.timeout(SENDE_FRIST_MS),
    headers: kopf,
    body: JSON.stringify({
      from: mail.from,
      to: mail.to,
      ...(mail.reply_to && mail.reply_to.length ? { reply_to: mail.reply_to } : {}),
      subject: mail.subject,
      html: mail.html,
      ...(mail.text ? { text: mail.text } : {}),
    }),
  });
  const koerper = await res.text();
  let messageId: string | null = null;
  try {
    const json: unknown = JSON.parse(koerper);
    if (json !== null && typeof json === 'object' && !Array.isArray(json)) {
      const id = (json as Record<string, unknown>).message_id;
      if (typeof id === 'string' && id.trim() !== '') messageId = id.trim();
    }
  } catch {
    // Kein JSON: keine Kennung. Der Rufer ordnet am HTTP-Status ein; der
    // rohe Körper reist mit.
  }
  return { http: res.status, messageId, koerper: koerper.slice(0, 1000) };
}
