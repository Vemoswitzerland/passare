// ════════════════════════════════════════════════════════════════════
// send-email/versand.ts — der Ablauf EINES Versands (ohne Netz, ohne DB)
// ────────────────────────────────────────────────────────────────────
// index.ts liest die Anfrage und baut die Porte (Datenbank, Anbieter);
// hier steht, in welcher Reihenfolge was geschieht. So lässt sich der
// Ablauf ohne Supabase und ohne Lettermint prüfen (versand.test.ts).
//
// Reihenfolge:
//   1. kein Schlüssel -> 503 `mail_token_missing`, nichts angelegt
//   2. Zeile in email_log sicherstellen (neu: status queued)
//   3. ist die Zeile schon `sent` -> 200 idempotent, kein Versand
//   4. VERSAND-SPERRE beanspruchen (Datenbank-Funktion, ein UPDATE):
//      nur EIN Aufruf je Zeile bekommt sie. Warum: Lettermint schützt
//      NICHT gegen gleichzeitige Anfragen mit demselben Idempotency-Key
//      (Probe T2, 3 von 3 doppelt). Und bei passare laufen zwei Aufrufe
//      derselben Zeile wirklich gleichzeitig: send-email legt die Zeile
//      an, der Datenbank-Auslöser `email_log_dispatch` ruft sofort
//      email-handler, und der ruft send-email mit derselben log_id.
//   5. senden, Idempotency-Key = log_id (schützt Wiederholungen
//      NACHEINANDER, z.B. ein Replay nach verlorener Antwort)
//   6. Ergebnis in die Zeile; bei Fehlschlag Sperre wieder frei
// ════════════════════════════════════════════════════════════════════

import type { AnbieterAntwort, AnbieterMail } from '../_shared/mail-anbieter.ts';

export type LogZeile = { status: string; resend_id: string | null };

export type Abschluss = {
  status: 'sent' | 'failed';
  /** Kennung des Anbieters. Spalte heisst bis Stufe 2 noch `resend_id` (Plan C5). */
  resend_id: string | null;
  error: string | null;
  subject: string;
  sent_at: string | null;
  /** true = Sperre wieder frei (ein späterer Versuch darf); false = sie bleibt stehen. */
  sperreFrei: boolean;
};

export interface VersandPorte {
  mailBereit(): boolean;
  /** Neue Zeile (status queued) -> id, oder Fehlertext. */
  logAnlegen(z: {
    template: string; to_email: string; subject: string; vars: Record<string, unknown>;
    user_id: string | null; related_id: string | null;
  }): Promise<{ id: string } | { fehler: string }>;
  logLesen(id: string): Promise<LogZeile | null>;
  /** true = dieser Aufruf hat die Sperre; false = ein anderer sendet gerade oder die Zeile ist sent. */
  beanspruchen(id: string): Promise<boolean | { fehler: string }>;
  /** Ergebnis in die Zeile schreiben; Fehlertext, wenn die Datenbank es nicht annahm. */
  abschliessen(id: string, a: Abschluss): Promise<void | { fehler: string }>;
  senden(mail: AnbieterMail, idempotencyKey: string): Promise<AnbieterAntwort>;
}

export type VersandEingabe = {
  template: string;
  to: string;
  vars: Record<string, unknown>;
  log_id?: string;
  user_id?: string;
  related_id?: string;
  subject: string;
  html: string;
  from: string;
  reply_to: string;
};

export type VersandErgebnis = { status: number; body: Record<string, unknown> };

export async function versende(e: VersandEingabe, p: VersandPorte): Promise<VersandErgebnis> {
  // 1. Kein Schlüssel: laut, bevor etwas entsteht. Eine wartende Zeile bleibt queued (sichtbar).
  if (!p.mailBereit()) {
    return { status: 503, body: { error: 'mail_token_missing', detail: 'MAIL_API_TOKEN nicht konfiguriert' } };
  }

  // 2. Zeile sicherstellen.
  let logId = e.log_id;
  if (!logId) {
    const neu = await p.logAnlegen({
      template: e.template, to_email: e.to, subject: e.subject, vars: e.vars,
      user_id: e.user_id ?? null, related_id: e.related_id ?? null,
    });
    if ('fehler' in neu) {
      return { status: 500, body: { error: 'email_log-Insert fehlgeschlagen', detail: neu.fehler } };
    }
    logId = neu.id;
  } else {
    // 3. Schon gesendet: nie ein zweites Mal.
    const z = await p.logLesen(logId);
    if (z?.status === 'sent') {
      return { status: 200, body: { ok: true, log_id: logId, message_id: z.resend_id, idempotent: true } };
    }
  }

  // 4. Versand-Sperre. Nur wer sie bekommt, sendet.
  const sperre = await p.beanspruchen(logId);
  if (typeof sperre === 'object') {
    return { status: 500, body: { error: 'versand_sperre_fehlgeschlagen', detail: sperre.fehler, log_id: logId } };
  }
  if (!sperre) {
    const z = await p.logLesen(logId);
    if (z?.status === 'sent') {
      return { status: 200, body: { ok: true, log_id: logId, message_id: z.resend_id, idempotent: true } };
    }
    // Ein anderer Aufruf sendet genau diese Zeile gerade: angenommen, nicht doppelt.
    return { status: 202, body: { ok: true, log_id: logId, laeuft_schon: true } };
  }

  // 5. Senden. Idempotency-Key = log_id (Plan C5).
  let antwort: AnbieterAntwort | null = null;
  let ohneAntwort: string | null = null;
  try {
    antwort = await p.senden(
      { from: e.from, to: [e.to], reply_to: [e.reply_to], subject: e.subject, html: e.html },
      logId,
    );
  } catch (err) {
    ohneAntwort = String(err);
  }

  // 6. Ergebnis festhalten (Transport-Status, keine Deutung).
  let a: Abschluss;
  if (antwort && antwort.http >= 200 && antwort.http < 300) {
    a = {
      status: 'sent', resend_id: antwort.messageId,
      error: antwort.messageId ? null : 'anbieter_ohne_kennung: angenommen, aber ohne message_id',
      subject: e.subject, sent_at: new Date().toISOString(), sperreFrei: false,
    };
  } else if (antwort && antwort.http === 409) {
    // T2: 409 = dieser Schlüssel wurde schon mit ANDEREM Inhalt benutzt. Mit ihm ging also
    // vermutlich schon eine Mail hinaus. Kein automatischer neuer Versuch (email-handler nimmt
    // nur queued); ein Replay von Hand bekommt dieselbe Antwort, solange der Schlüssel gilt (24 h).
    a = {
      status: 'failed', resend_id: null,
      error: `anbieter_409: Schlüssel schon mit anderem Inhalt benutzt, Mail ging vermutlich schon hinaus: ${antwort.koerper}`,
      subject: e.subject, sent_at: null, sperreFrei: true,
    };
  } else if (antwort) {
    a = {
      status: 'failed', resend_id: null, error: `anbieter_${antwort.http}: ${antwort.koerper}`,
      subject: e.subject, sent_at: null, sperreFrei: true,
    };
  } else {
    // Keine Antwort: der Anbieter kann sie trotzdem angenommen haben. Ein Replay mit derselben
    // log_id (= Idempotency-Key, gleicher Inhalt) bekommt innert 24 h die gespeicherte Antwort.
    a = {
      status: 'failed', resend_id: null, error: `anbieter_ohne_antwort: ${ohneAntwort}`,
      subject: e.subject, sent_at: null, sperreFrei: true,
    };
  }
  const fest = await p.abschliessen(logId, a);
  if (fest && 'fehler' in fest) {
    // Laut statt still: die Zeile bleibt queued und gesperrt (10 min). Ein späteres Replay mit
    // derselben log_id bekommt vom Anbieter die gespeicherte Antwort (gleicher Schlüssel, gleicher
    // Inhalt, 24 h) statt einer zweiten Mail.
    return {
      status: 500,
      body: { error: 'email_log_update_fehlgeschlagen', detail: fest.fehler, log_id: logId,
              anbieter_status: a.status, message_id: a.resend_id },
    };
  }

  if (a.status === 'failed') {
    return { status: 502, body: { error: a.error, log_id: logId } };
  }
  return { status: 200, body: { ok: true, log_id: logId, message_id: a.resend_id } };
}
