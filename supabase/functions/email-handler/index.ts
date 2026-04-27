// ════════════════════════════════════════════════════════════════════
// Edge Function: email-handler
// ────────────────────────────────────────────────────────────────────
// Verarbeitet "queued" Einträge aus email_log und ruft send-email auf.
//
// Zwei Trigger-Modi:
//
// 1. POST /functions/v1/email-handler { id: uuid }
//    Wird von DB-Trigger (queue_email + pg_notify) via webhook angeworfen
//    ODER manuell zum Replay einer einzelnen Email.
//
// 2. POST /functions/v1/email-handler {}
//    "Drain"-Modus: holt alle queued Einträge der letzten 10 min
//    und verarbeitet sie. Wird von Cron alle 1–5 min angestossen
//    als Fallback falls pg_notify-Webhook ausfällt.
//
// Hinweis: Postgres LISTEN ist im Edge-Runtime nicht persistent verfügbar
// (Cold-Start, Function-Limits). Stattdessen empfehlen wir DB-Webhook
// (Supabase Database Webhook auf email_log INSERT) → email-handler.
// ════════════════════════════════════════════════════════════════════

// @ts-ignore — Deno runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

// @ts-ignore
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
// @ts-ignore
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const SEND_EMAIL_URL = `${SUPABASE_URL}/functions/v1/send-email`;

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

type LogRow = {
  id: string;
  template: string;
  to_email: string;
  vars: Record<string, unknown> | null;
  user_id: string | null;
  related_id: string | null;
};

async function processOne(supabase: any, row: LogRow) {
  // Vor Re-Send: status auf 'queued' lassen — send-email setzt sent/failed
  const resp = await fetch(SEND_EMAIL_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      template:   row.template,
      to:         row.to_email,
      vars:       row.vars ?? {},
      log_id:     row.id,
      user_id:    row.user_id,
      related_id: row.related_id,
    }),
  });

  let detail: unknown = null;
  try { detail = await resp.json(); } catch { /* ignore */ }

  return { id: row.id, status: resp.status, detail };
}

// @ts-ignore — Deno
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return json(500, { error: 'Supabase-Service-Credentials fehlen' });
  }

  let body: { id?: string; record?: { id?: string } } = {};
  try { body = await req.json(); } catch { /* leer ist OK = drain-mode */ }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  // ─── Mode 1: Single (DB-Webhook oder Replay) ──
  // Supabase Database Webhooks senden { type, table, record, old_record }
  // — wir akzeptieren beide Formen.
  const targetId = body.id ?? body.record?.id;

  if (targetId) {
    const { data, error } = await supabase
      .from('email_log')
      .select('id, template, to_email, vars, user_id, related_id, status')
      .eq('id', targetId)
      .maybeSingle();

    if (error || !data) {
      return json(404, { error: 'email_log-Eintrag nicht gefunden', detail: error?.message });
    }
    if (data.status !== 'queued') {
      return json(200, { ok: true, skipped: true, reason: `status=${data.status}` });
    }

    const result = await processOne(supabase, data as LogRow);
    return json(200, { ok: true, mode: 'single', result });
  }

  // ─── Mode 2: Drain (Cron-Fallback) ──
  // Holt bis zu 50 queued Mails der letzten 10 min.
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const { data: rows, error } = await supabase
    .from('email_log')
    .select('id, template, to_email, vars, user_id, related_id')
    .eq('status', 'queued')
    .gte('created_at', tenMinAgo)
    .order('created_at', { ascending: true })
    .limit(50);

  if (error) {
    return json(500, { error: 'Drain-Query fehlgeschlagen', detail: error.message });
  }

  const results: unknown[] = [];
  for (const row of (rows ?? []) as LogRow[]) {
    try {
      const r = await processOne(supabase, row);
      results.push(r);
    } catch (err) {
      results.push({ id: row.id, error: String(err) });
    }
  }

  return json(200, { ok: true, mode: 'drain', count: results.length, results });
});
