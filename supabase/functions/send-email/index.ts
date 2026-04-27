// ════════════════════════════════════════════════════════════════════
// Edge Function: send-email
// ────────────────────────────────────────────────────────────────────
// POST /functions/v1/send-email
// Body: { template: string, to: string, vars?: object, log_id?: uuid,
//         user_id?: uuid, related_id?: uuid }
//
// Workflow:
//   1. Render via _shared/render.ts (kein React-Render zur Laufzeit)
//   2. POST an Resend /emails
//   3. email_log upserten (insert wenn log_id fehlt, sonst update)
//   4. Bei Fehler: status=failed + error
//
// Hinweis: --no-verify-jwt deployed, weil:
//   - Public Endpoint für Auth-Triggers (Welcome, Verify, Reset)
//   - Schutz via Rate-Limiting auf Resend-Seite + ENV-API-Key
// ════════════════════════════════════════════════════════════════════

// @ts-ignore — Deno runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';
import { renderEmail, KNOWN_TEMPLATES } from '../_shared/render.ts';

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
const RESEND_API_KEY  = Deno.env.get('RESEND_API_KEY');
// @ts-ignore
const SUPABASE_URL    = Deno.env.get('SUPABASE_URL');
// @ts-ignore
const SERVICE_ROLE    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
// @ts-ignore
const FROM_DEFAULT    = Deno.env.get('EMAIL_FROM')      ?? 'passare <noreply@passare.ch>';
// @ts-ignore
const REPLY_TO        = Deno.env.get('EMAIL_REPLY_TO')  ?? 'info@passare.ch';

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

// ─── Handler ─────────────────────────────────────────────────────
// @ts-ignore — Deno
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  if (!RESEND_API_KEY) {
    return json(500, { error: 'RESEND_API_KEY nicht konfiguriert' });
  }
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return json(500, { error: 'Supabase-Service-Credentials fehlen' });
  }

  let body: SendBody;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'Ungültiger JSON-Body' });
  }

  const { template, to, vars = {}, log_id, user_id, related_id, subject_override } = body;

  if (!template || !to) {
    return json(400, { error: 'template und to sind Pflicht' });
  }
  if (!KNOWN_TEMPLATES.includes(template as typeof KNOWN_TEMPLATES[number])) {
    return json(400, { error: `Unbekanntes Template: ${template}` });
  }

  // ─── Render ──
  let rendered;
  try {
    rendered = renderEmail(template, vars);
  } catch (err) {
    return json(500, { error: 'Render-Fehler', detail: String(err) });
  }

  const subject = subject_override ?? rendered.subject;
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  // ─── log_id sicherstellen ──
  let logId = log_id;
  if (!logId) {
    const { data, error } = await supabase
      .from('email_log')
      .insert({
        template,
        to_email: to,
        subject,
        vars,
        user_id:  user_id  ?? null,
        related_id: related_id ?? null,
        status: 'queued',
      })
      .select('id')
      .single();
    if (error) {
      return json(500, { error: 'email_log-Insert fehlgeschlagen', detail: error.message });
    }
    logId = data.id;
  }

  // ─── Resend-Call ──
  let resendId: string | null = null;
  let sendError: string | null = null;
  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from:     FROM_DEFAULT,
        to:       [to],
        reply_to: REPLY_TO,
        subject,
        html: rendered.html,
      }),
    });

    const respBody = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      sendError = `Resend ${resp.status}: ${JSON.stringify(respBody)}`;
    } else {
      resendId = respBody.id ?? null;
    }
  } catch (err) {
    sendError = `Fetch-Fehler: ${String(err)}`;
  }

  // ─── Log updaten ──
  await supabase
    .from('email_log')
    .update({
      status:    sendError ? 'failed' : 'sent',
      resend_id: resendId,
      error:     sendError,
      subject,
      sent_at:   sendError ? null : new Date().toISOString(),
    })
    .eq('id', logId);

  if (sendError) {
    return json(502, { error: sendError, log_id: logId });
  }

  return json(200, { ok: true, log_id: logId, resend_id: resendId });
});
