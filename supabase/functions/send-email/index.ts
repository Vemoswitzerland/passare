// ════════════════════════════════════════════════════════════════════
// Edge Function: send-email
// ────────────────────────────────────────────────────────────────────
// POST /functions/v1/send-email
// Body: { template: string, to: string, vars?: object, log_id?: uuid,
//         user_id?: uuid, related_id?: uuid }
//
// Workflow (Ablauf in ./versand.ts, Anbieter in ../_shared/mail-anbieter.ts):
//   1. Render via _shared/render.ts (kein React-Render zur Laufzeit)
//   2. email_log-Zeile sicherstellen (insert wenn log_id fehlt)
//   3. Versand-Sperre der Zeile beanspruchen (nur EIN Aufruf sendet)
//   4. POST an den Mail-Anbieter (Lettermint), Idempotency-Key = log_id
//   5. email_log: status sent (Kennung in resend_id) oder failed + error
//
// Hinweis: --no-verify-jwt deployed, weil:
//   - Public Endpoint für Auth-Triggers (Welcome, Verify, Reset)
//   - Schutz via INTERNAL_EMAIL_KEY (wenn gesetzt) + Anbieter-Schlüssel
// ════════════════════════════════════════════════════════════════════

// @ts-ignore — Deno runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';
import { renderEmail, KNOWN_TEMPLATES } from '../_shared/render.ts';
import { mailBereit, sendeBeimAnbieter } from '../_shared/mail-anbieter.ts';
import { versende, type VersandPorte } from './versand.ts';

// ─── Types ───────────────────────────────────────────────────────
type SendBody = {
  template: string;
  to: string;
  vars?: Record<string, unknown>;
  log_id?: string;
  user_id?: string;
  related_id?: string;
  subject_override?: string;
};

// ─── Setup ───────────────────────────────────────────────────────
// @ts-ignore
const SUPABASE_URL    = Deno.env.get('SUPABASE_URL');
// @ts-ignore
const SERVICE_ROLE    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
// @ts-ignore
const FROM_DEFAULT    = Deno.env.get('EMAIL_FROM')      ?? 'passare <noreply@passare.ch>';
// @ts-ignore
const REPLY_TO        = Deno.env.get('EMAIL_REPLY_TO')  ?? 'info@passare.ch';

const ALLOWED_ORIGINS = [
  'https://passare.ch',
  'https://www.passare.ch',
  'https://passare-ch.vercel.app',
];

function corsHeadersFor(origin: string | null) {
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin':  allow,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-key',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

const json = (status: number, payload: unknown, headers: Record<string, string>) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });

// ─── Handler ─────────────────────────────────────────────────────
// @ts-ignore — Deno
Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  const corsHeaders = corsHeadersFor(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' }, corsHeaders);
  }

  // ── Internal-API-Key statt JWT-Verify (siehe Comment oben) ──
  // @ts-ignore
  const expectedKey = Deno.env.get('INTERNAL_EMAIL_KEY');
  if (expectedKey) {
    const provided = req.headers.get('x-internal-key');
    if (provided !== expectedKey) {
      return json(401, { error: 'Unauthorized' }, corsHeaders);
    }
  }

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return json(500, { error: 'Supabase-Service-Credentials fehlen' }, corsHeaders);
  }

  let body: SendBody;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'Ungültiger JSON-Body' }, corsHeaders);
  }

  const { template, to, vars = {}, log_id, user_id, related_id, subject_override } = body;

  if (!template || !to) {
    return json(400, { error: 'template und to sind Pflicht' }, corsHeaders);
  }
  if (!KNOWN_TEMPLATES.includes(template as typeof KNOWN_TEMPLATES[number])) {
    return json(400, { error: `Unbekanntes Template: ${template}` }, corsHeaders);
  }

  // ─── Render ──
  let rendered;
  try {
    rendered = renderEmail(template, vars);
  } catch (err) {
    return json(500, { error: 'Render-Fehler', detail: String(err) }, corsHeaders);
  }

  const subject = subject_override ?? rendered.subject;
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  // Die Porte: was versand.ts von Datenbank und Anbieter braucht.
  const porte: VersandPorte = {
    mailBereit,
    async logAnlegen(z) {
      const { data, error } = await supabase
        .from('email_log')
        .insert({ ...z, status: 'queued' })
        .select('id')
        .single();
      return error ? { fehler: error.message } : { id: data.id };
    },
    async logLesen(id) {
      const { data } = await supabase
        .from('email_log')
        .select('status, resend_id')
        .eq('id', id)
        .maybeSingle();
      return data ?? null;
    },
    async beanspruchen(id) {
      // Migration 20260929200000_email_versand_sperre.sql
      const { data, error } = await supabase.rpc('email_log_versand_beanspruchen', { p_id: id });
      return error ? { fehler: error.message } : data === true;
    },
    async abschliessen(id, a) {
      const { error } = await supabase
        .from('email_log')
        .update({
          status:    a.status,
          resend_id: a.resend_id,
          error:     a.error,
          subject:   a.subject,
          sent_at:   a.sent_at,
          ...(a.sperreFrei ? { versand_beansprucht_am: null } : {}),
        })
        .eq('id', id);
      if (error) return { fehler: error.message };
    },
    senden: sendeBeimAnbieter,
  };

  const ergebnis = await versende({
    template, to, vars, log_id, user_id, related_id,
    subject, html: rendered.html, from: FROM_DEFAULT, reply_to: REPLY_TO,
  }, porte);
  return json(ergebnis.status, ergebnis.body, corsHeaders);
});
