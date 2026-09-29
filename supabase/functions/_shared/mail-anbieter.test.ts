// ════════════════════════════════════════════════════════════════════
// Wand: der eine Anbieter-Zugang (_shared/mail-anbieter.ts)
// Lauf: deno test --allow-env --allow-read supabase/functions/_shared/mail-anbieter.test.ts
//
// Teil 1: was auf die Leitung geht (Attrappe für fetch, kein Netz).
// Teil 2: die Klasse. passare sendet an genau ZWEI Stellen; beide über
// diese Datei. Durchsucht wird das ganze Repo (src/, supabase/functions/,
// emails/, package.json), nicht eine Liste von Dateien: eine dritte
// Versand-Stelle, die am Modul vorbeigeht, macht die Wand rot.
// ════════════════════════════════════════════════════════════════════

import { ANBIETER_ENDPOINT, mailBereit, sendeBeimAnbieter } from './mail-anbieter.ts';

function gleich(ist: unknown, soll: unknown, was: string) {
  const a = JSON.stringify(ist);
  const b = JSON.stringify(soll);
  if (a !== b) throw new Error(`${was}: ist ${a}, soll ${b}`);
}

type Ruf = { url: string; init: RequestInit };

async function mitAttrappe<T>(antwort: () => Response, f: (rufe: Ruf[]) => Promise<T>): Promise<T> {
  const echt = globalThis.fetch;
  const rufe: Ruf[] = [];
  globalThis.fetch = ((url: string, init: RequestInit) => {
    rufe.push({ url: String(url), init });
    return Promise.resolve(antwort());
  }) as typeof fetch;
  const vorher = Deno.env.get('MAIL_API_TOKEN');
  Deno.env.set('MAIL_API_TOKEN', 'lm_test_schluessel');
  try {
    return await f(rufe);
  } finally {
    globalThis.fetch = echt;
    if (vorher === undefined) Deno.env.delete('MAIL_API_TOKEN');
    else Deno.env.set('MAIL_API_TOKEN', vorher);
  }
}

const MAIL = { from: 'passare <noreply@passare.ch>', to: ['ok@lettermint.dev'] as [string], subject: 'S', html: '<p>h</p>' };

// ── Teil 1: Leitung ──
Deno.test('Leitung: Adresse, Schlüssel-Kopf, Idempotency-Key, keine Umleitung', async () => {
  await mitAttrappe(() => new Response('{"message_id":"lm-1","status":"pending"}', { status: 202 }), async (rufe) => {
    const a = await sendeBeimAnbieter({ ...MAIL, reply_to: ['info@passare.ch'], text: 't' }, 'log-42');
    gleich(a, { http: 202, messageId: 'lm-1', koerper: '{"message_id":"lm-1","status":"pending"}' }, 'Antwort');
    gleich(rufe.length, 1, 'Rufe');
    gleich(rufe[0].url, 'https://api.lettermint.co/v1/send', 'Adresse');
    gleich(ANBIETER_ENDPOINT, 'https://api.lettermint.co/v1/send', 'Konstante');
    const k = rufe[0].init.headers as Record<string, string>;
    gleich(k['x-lettermint-token'], 'lm_test_schluessel', 'Schlüssel-Kopf');
    gleich(k['Idempotency-Key'], 'log-42', 'Idempotency-Key');
    gleich(rufe[0].init.redirect, 'error', 'Umleitung');
    gleich(JSON.parse(String(rufe[0].init.body)), {
      from: 'passare <noreply@passare.ch>', to: ['ok@lettermint.dev'], reply_to: ['info@passare.ch'],
      subject: 'S', html: '<p>h</p>', text: 't',
    }, 'Körper');
  });
});

Deno.test('Leitung: ohne Idempotency-Key (null) steht die Kopfzeile nicht da', async () => {
  await mitAttrappe(() => new Response('{"message_id":"lm-2"}', { status: 202 }), async (rufe) => {
    await sendeBeimAnbieter(MAIL, null);
    const k = rufe[0].init.headers as Record<string, string>;
    gleich('Idempotency-Key' in k, false, 'Kopfzeile');
  });
});

Deno.test('Leitung: mehr als ein Empfänger wird verweigert, nichts gesendet (T6)', async () => {
  await mitAttrappe(() => new Response('{}', { status: 202 }), async (rufe) => {
    let geworfen = false;
    try {
      await sendeBeimAnbieter({ ...MAIL, to: ['a@x.ch', 'b@x.ch'] as unknown as [string] }, 'k');
    } catch {
      geworfen = true;
    }
    gleich([geworfen, rufe.length], [true, 0], 'verweigert, kein Ruf');
  });
});

Deno.test('Leitung: Antwort ohne JSON -> keine Kennung, Status und Körper reisen mit', async () => {
  await mitAttrappe(() => new Response('Bad Gateway', { status: 502 }), async () => {
    gleich(await sendeBeimAnbieter(MAIL, 'k'), { http: 502, messageId: null, koerper: 'Bad Gateway' }, 'Antwort');
  });
});

Deno.test('mailBereit folgt MAIL_API_TOKEN (leer = nicht bereit)', () => {
  const vorher = Deno.env.get('MAIL_API_TOKEN');
  try {
    Deno.env.set('MAIL_API_TOKEN', '  ');
    gleich(mailBereit(), false, 'nur Leerzeichen');
    Deno.env.delete('MAIL_API_TOKEN');
    gleich(mailBereit(), false, 'fehlt');
    Deno.env.set('MAIL_API_TOKEN', 'lm_x');
    gleich(mailBereit(), true, 'gesetzt');
  } finally {
    if (vorher === undefined) Deno.env.delete('MAIL_API_TOKEN');
    else Deno.env.set('MAIL_API_TOKEN', vorher);
  }
});

// ── Teil 2: die Klasse (ganzes Repo) ──
const WURZEL = new URL('../../../', import.meta.url);
const MODUL = 'supabase/functions/_shared/mail-anbieter.ts';

async function codeDateien(): Promise<Map<string, string>> {
  const aus = new Map<string, string>();
  async function lauf(rel: string) {
    for await (const e of Deno.readDir(new URL(rel, WURZEL))) {
      const pfad = `${rel}${e.name}`;
      if (e.isDirectory) {
        if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
        await lauf(`${pfad}/`);
      } else if (/\.(ts|tsx|js|mjs|cjs)$/.test(e.name) && !/\.test\.ts$/.test(e.name)) {
        aus.set(pfad, await Deno.readTextFile(new URL(pfad, WURZEL)));
      }
    }
  }
  for (const d of ['src/', 'supabase/functions/', 'emails/']) await lauf(d);
  return aus;
}

function treffer(dateien: Map<string, string>, muster: RegExp): string[] {
  return [...dateien].filter(([, text]) => muster.test(text)).map(([p]) => p).sort();
}

Deno.test('Klasse a: kein Ruf an Resend mehr (api.resend.com, Paket resend)', async () => {
  const d = await codeDateien();
  gleich(treffer(d, /api\.resend\.com/), [], 'api.resend.com');
  gleich(treffer(d, /from\s+['"]resend['"]|require\(\s*['"]resend['"]\s*\)/), [], 'Paket resend importiert');
  const pkg = JSON.parse(await Deno.readTextFile(new URL('package.json', WURZEL)));
  gleich('resend' in (pkg.dependencies ?? {}) || 'resend' in (pkg.devDependencies ?? {}), false, 'package.json');
});

Deno.test('Klasse b: der alte Schlüssel RESEND_API_KEY wird nirgends mehr gelesen', async () => {
  gleich(treffer(await codeDateien(), /RESEND_API_KEY/), [], 'RESEND_API_KEY');
});

Deno.test('Klasse c: Adresse und Schlüssel-Kopf des Anbieters nur im Modul', async () => {
  const d = await codeDateien();
  gleich(treffer(d, /api\.lettermint\.co/), [MODUL], 'api.lettermint.co');
  gleich(treffer(d, /x-lettermint-token/i), [MODUL], 'x-lettermint-token');
});

Deno.test('Klasse d: MAIL_API_TOKEN wird nur im Modul gelesen', async () => {
  const d = await codeDateien();
  // Erlaubt ist der Name sonst nur in Meldungen (console.warn, detail-Text), nie als Lesestelle.
  const lesen = /(Deno\.env\.get|process\.env)\s*(\(\s*['"]MAIL_API_TOKEN|\.MAIL_API_TOKEN|\[\s*['"]MAIL_API_TOKEN)/;
  gleich(treffer(d, lesen), [MODUL], 'Lesestellen');
});

Deno.test('Klasse e: genau die zwei Versand-Stellen senden, beide über das Modul', async () => {
  const d = await codeDateien();
  gleich(treffer(d, /\bsendeBeimAnbieter\b/).filter((p) => p !== MODUL), [
    'src/app/verkaufen/start/actions.ts',
    'supabase/functions/send-email/index.ts',
  ], 'Rufer von sendeBeimAnbieter');
  // Kein anderer Weg zu einem Mail-Anbieter: kein fetch an eine .../send- oder .../emails-Adresse
  // eines Anbieters ausserhalb des Moduls (Resend, Lettermint, Postmark, Sendgrid, Mailgun, SES).
  const fremd = /https:\/\/api\.(resend\.com|lettermint\.co|postmarkapp\.com|sendgrid\.com|mailgun\.net)|email\.[a-z0-9-]+\.amazonaws\.com|smtp\./;
  gleich(treffer(d, fremd).filter((p) => p !== MODUL), [], 'Anbieter-Adressen ausserhalb des Moduls');
});
