// ════════════════════════════════════════════════════════════════════
// Wand: Ablauf eines Versands (send-email/versand.ts)
// Lauf: deno test supabase/functions/send-email/versand.test.ts
//
// Die Attrappe der Datenbank beansprucht die Versand-Sperre genau wie die
// Datenbank-Funktion `email_log_versand_beanspruchen` (Migration
// 20260929200000): frei = keine Sperre oder älter als 10 min, und nicht sent.
// JavaScript ist einfädig, darum ist die Attrappe atomar wie das UPDATE.
// Die echte Funktion prüft supabase/tests/versand-sperre-pg.sh an Postgres.
// ════════════════════════════════════════════════════════════════════

import type { AnbieterAntwort, AnbieterMail } from '../_shared/mail-anbieter.ts';
import { type Abschluss, type VersandEingabe, type VersandPorte, versende } from './versand.ts';

function gleich(ist: unknown, soll: unknown, was: string) {
  const a = JSON.stringify(ist);
  const b = JSON.stringify(soll);
  if (a !== b) throw new Error(`${was}: ist ${a}, soll ${b}`);
}

const warte = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Zeile = { status: string; resend_id: string | null; sperre: number | null; error: string | null };

function welt(opt: {
  bereit?: boolean;
  antwort?: (mail: AnbieterMail, key: string) => Promise<AnbieterAntwort>;
  updateFehler?: string;
  sperreFehler?: string;
} = {}) {
  const zeilen = new Map<string, Zeile>();
  const gesendet: { mail: AnbieterMail; key: string }[] = [];
  const abschluesse: { id: string; a: Abschluss }[] = [];
  let n = 0;
  let uhr = Date.now();
  const porte: VersandPorte = {
    mailBereit: () => opt.bereit ?? true,
    async logAnlegen() {
      await warte(1);
      const id = `log-${++n}`;
      zeilen.set(id, { status: 'queued', resend_id: null, sperre: null, error: null });
      return { id };
    },
    async logLesen(id) {
      await warte(1);
      const z = zeilen.get(id);
      return z ? { status: z.status, resend_id: z.resend_id } : null;
    },
    async beanspruchen(id) {
      await warte(1);
      if (opt.sperreFehler) return { fehler: opt.sperreFehler };
      const z = zeilen.get(id);
      if (!z || z.status === 'sent') return false;
      if (z.sperre !== null && z.sperre >= uhr - 10 * 60 * 1000) return false;
      z.sperre = uhr;
      return true;
    },
    async abschliessen(id, a) {
      await warte(1);
      abschluesse.push({ id, a });
      if (opt.updateFehler) return { fehler: opt.updateFehler };
      const z = zeilen.get(id)!;
      z.status = a.status;
      z.resend_id = a.resend_id;
      z.error = a.error;
      if (a.sperreFrei) z.sperre = null;
    },
    async senden(mail, key) {
      gesendet.push({ mail, key });
      if (opt.antwort) return await opt.antwort(mail, key);
      await warte(20); // der Anbieter braucht Zeit: beide Aufrufe sind gleichzeitig unterwegs
      return { http: 202, messageId: `lm-${gesendet.length}`, koerper: '{}' };
    },
  };
  return {
    porte, zeilen, gesendet, abschluesse,
    vorspulen(ms: number) { uhr += ms; },
  };
}

function eingabe(extra: Partial<VersandEingabe> = {}): VersandEingabe {
  return {
    template: 'welcome', to: 'ok@lettermint.dev', vars: {}, subject: 'Willkommen', html: '<p>x</p>',
    from: 'passare <noreply@passare.ch>', reply_to: 'info@passare.ch', ...extra,
  };
}

// ── T2-Wand (Auflage A-L0b-1): gleichzeitig dieselbe Zeile -> genau EIN Versand ──
Deno.test('Sperre: zwei gleichzeitige Aufrufe mit derselben log_id senden genau einmal', async () => {
  const w = welt();
  w.zeilen.set('log-x', { status: 'queued', resend_id: null, sperre: null, error: null });
  const [a, b] = await Promise.all([
    versende(eingabe({ log_id: 'log-x' }), w.porte),
    versende(eingabe({ log_id: 'log-x' }), w.porte),
  ]);
  gleich(w.gesendet.length, 1, 'Anbieter-Rufe');
  gleich([a.status, b.status].sort(), [200, 202], 'Antworten (einer sendet, einer läuft schon)');
  gleich(w.zeilen.get('log-x')!.status, 'sent', 'Zeile');
});

// ── Das echte Rennen bei passare: send-email legt an, der Auslöser ruft email-handler ──
Deno.test('Sperre: Anlegen + gleichzeitiger email-handler-Aufruf derselben Zeile senden genau einmal', async () => {
  const w = welt();
  const erster = versende(eingabe(), w.porte);
  // Der Auslöser email_log_dispatch feuert nach dem Anlegen; email-handler ruft send-email mit log_id.
  while (!w.zeilen.has('log-1')) await warte(1);
  const zweiter = versende(eingabe({ log_id: 'log-1' }), w.porte);
  const [a, b] = await Promise.all([erster, zweiter]);
  gleich(w.gesendet.length, 1, 'Anbieter-Rufe');
  gleich(a.status, 200, 'anlegender Aufruf sendet');
  gleich(b.status, 202, 'email-handler-Aufruf: läuft schon');
});

Deno.test('Sperre: nach einem Fehlschlag ist die Zeile wieder frei (Replay von Hand sendet)', async () => {
  let mal = 0;
  const w = welt({
    antwort: async () => (++mal === 1 ? { http: 500, messageId: null, koerper: 'kaputt' } : { http: 202, messageId: 'lm-2', koerper: '{}' }),
  });
  w.zeilen.set('log-r', { status: 'queued', resend_id: null, sperre: null, error: null });
  const a = await versende(eingabe({ log_id: 'log-r' }), w.porte);
  gleich(a.status, 502, 'erster Versuch');
  gleich(w.zeilen.get('log-r')!.sperre, null, 'Sperre frei nach Fehlschlag');
  const b = await versende(eingabe({ log_id: 'log-r' }), w.porte);
  gleich(b.status, 200, 'Replay');
  gleich(w.gesendet.length, 2, 'Anbieter-Rufe');
});

Deno.test('Sperre: eine liegengebliebene Sperre (Abbruch) ist nach 10 Minuten wieder frei, vorher nicht', async () => {
  const w = welt();
  w.zeilen.set('log-s', { status: 'queued', resend_id: null, sperre: null, error: null });
  gleich(await w.porte.beanspruchen('log-s'), true, 'erste Sperre (danach bricht der Aufruf ab)');
  const vorher = await versende(eingabe({ log_id: 'log-s' }), w.porte);
  gleich(vorher.status, 202, 'innert 10 min: läuft schon');
  w.vorspulen(10 * 60 * 1000 + 1);
  const nachher = await versende(eingabe({ log_id: 'log-s' }), w.porte);
  gleich(nachher.status, 200, 'nach 10 min: sendet');
  gleich(w.gesendet.length, 1, 'Anbieter-Rufe');
});

Deno.test('Idempotency-Key = log_id (Plan C5), beim Anlegen die neue Kennung', async () => {
  const w = welt();
  await versende(eingabe(), w.porte);
  w.zeilen.set('log-k', { status: 'queued', resend_id: null, sperre: null, error: null });
  await versende(eingabe({ log_id: 'log-k' }), w.porte);
  gleich(w.gesendet.map((g) => g.key), ['log-1', 'log-k'], 'Schlüssel');
});

Deno.test('Genau EIN Empfänger je Mail, kein cc/bcc (T6: Zeilen-Status gehört diesem Empfänger)', async () => {
  const w = welt();
  await versende(eingabe(), w.porte);
  const m = w.gesendet[0].mail as unknown as Record<string, unknown>;
  gleich(m.to, ['ok@lettermint.dev'], 'to');
  gleich('cc' in m || 'bcc' in m, false, 'cc/bcc');
  gleich(m.reply_to, ['info@passare.ch'], 'reply_to');
});

Deno.test('Kein Schlüssel: 503 mail_token_missing, nichts angelegt, nichts gesendet', async () => {
  const w = welt({ bereit: false });
  const r = await versende(eingabe(), w.porte);
  gleich(r.status, 503, 'Status');
  gleich(r.body.error, 'mail_token_missing', 'Fehler');
  gleich(w.zeilen.size + w.gesendet.length, 0, 'angelegt + gesendet');
});

Deno.test('Schon sent: kein zweiter Versand', async () => {
  const w = welt();
  w.zeilen.set('log-d', { status: 'sent', resend_id: 'lm-alt', sperre: null, error: null });
  const r = await versende(eingabe({ log_id: 'log-d' }), w.porte);
  gleich([r.status, r.body.idempotent, r.body.message_id], [200, true, 'lm-alt'], 'Antwort');
  gleich(w.gesendet.length, 0, 'Anbieter-Rufe');
});

Deno.test('409 (Schlüssel mit anderem Inhalt benutzt): failed mit anbieter_409, nie sent', async () => {
  const w = welt({ antwort: async () => ({ http: 409, messageId: null, koerper: '{"message":"used"}' }) });
  const r = await versende(eingabe(), w.porte);
  gleich(r.status, 502, 'Status');
  const a = w.abschluesse[0].a;
  gleich([a.status, a.sperreFrei, String(a.error).startsWith('anbieter_409')], ['failed', true, true], 'Abschluss');
});

Deno.test('Keine Antwort (Netz/Frist): failed mit anbieter_ohne_antwort, Sperre frei', async () => {
  const w = welt({ antwort: () => Promise.reject(new Error('Zeitueberschreitung')) });
  const r = await versende(eingabe(), w.porte);
  gleich(r.status, 502, 'Status');
  const a = w.abschluesse[0].a;
  gleich([a.status, a.sperreFrei, String(a.error).startsWith('anbieter_ohne_antwort')], ['failed', true, true], 'Abschluss');
});

Deno.test('4xx (z.B. Domain nicht bestätigt): failed mit anbieter_422 und Grund', async () => {
  const w = welt({ antwort: async () => ({ http: 422, messageId: null, koerper: '{"message":"domain"}' }) });
  await versende(eingabe(), w.porte);
  gleich(String(w.abschluesse[0].a.error), 'anbieter_422: {"message":"domain"}', 'Fehler');
});

Deno.test('202 ohne message_id: sent, aber sichtbar anbieter_ohne_kennung', async () => {
  const w = welt({ antwort: async () => ({ http: 202, messageId: null, koerper: '{}' }) });
  const r = await versende(eingabe(), w.porte);
  gleich(r.status, 200, 'Status');
  const a = w.abschluesse[0].a;
  gleich([a.status, a.resend_id, String(a.error).startsWith('anbieter_ohne_kennung')], ['sent', null, true], 'Abschluss');
});

Deno.test('Kennung des Anbieters landet in resend_id (Spalte bis Stufe 2)', async () => {
  const w = welt({ antwort: async () => ({ http: 202, messageId: 'lm-uuid', koerper: '{}' }) });
  const r = await versende(eingabe(), w.porte);
  gleich([r.body.message_id, w.zeilen.get('log-1')!.resend_id, w.zeilen.get('log-1')!.error], ['lm-uuid', 'lm-uuid', null], 'Kennung');
});

Deno.test('Datenbank nimmt das Ergebnis nicht an: laut 500, nicht still 200', async () => {
  const w = welt({ updateFehler: 'verbindung weg' });
  const r = await versende(eingabe(), w.porte);
  gleich([r.status, r.body.error, r.body.message_id], [500, 'email_log_update_fehlgeschlagen', 'lm-1'], 'Antwort');
});

Deno.test('Sperre nicht beanspruchbar (Datenbank-Fehler): 500, nichts gesendet', async () => {
  const w = welt({ sperreFehler: 'function does not exist' });
  const r = await versende(eingabe(), w.porte);
  gleich([r.status, r.body.error], [500, 'versand_sperre_fehlgeschlagen'], 'Antwort');
  gleich(w.gesendet.length, 0, 'Anbieter-Rufe');
});

// ── Die Verdrahtung in index.ts ruft genau die Funktion, die die Migration anlegt ──
Deno.test('index.ts ruft die Sperr-Funktion der Migration beim Namen', async () => {
  const hier = new URL('.', import.meta.url);
  const index = await Deno.readTextFile(new URL('index.ts', hier));
  const mig = await Deno.readTextFile(new URL('../../migrations/20260929200000_email_versand_sperre.sql', hier));
  const name = /rpc\('([a-z_]+)'/.exec(index)?.[1];
  gleich(name, 'email_log_versand_beanspruchen', 'RPC-Name in index.ts');
  gleich(mig.includes(`create or replace function public.${name}(p_id uuid)`), true, 'Funktion in der Migration');
  gleich(index.includes("rpc('email_log_versand_beanspruchen', { p_id: id })"), true, 'Parametername p_id');
  gleich(/versand_beansprucht_am: null/.test(index), true, 'index.ts gibt die Sperre bei Fehlschlag frei');
});
