// ════════════════════════════════════════════════════════════════════
// Edge Function: auth-email-hook
// ────────────────────────────────────────────────────────────────────
// Wird von Supabase Auth via "Send Email Hook" aufgerufen wenn ein
// Auth-Event eine Mail erfordert (Signup-Verify, Password-Reset,
// Magic-Link, Email-Change). Wir leiten an die send-email Edge Function
// weiter, damit ÜBERALL dieselben Templates aus _shared/render.ts
// gerendert werden — kein Design-Drift zwischen Auth-Mails und
// Transactional-Mails.
//
// Setup im Supabase Dashboard:
//   Authentication → Hooks → Send Email Hook
//   - Type: HTTPS
//   - URL: https://<project>.supabase.co/functions/v1/auth-email-hook
//   - Secret: <SEND_EMAIL_HOOK_SECRET ENV var, beginnt mit v1,whsec_>
//
// ENV-Vars in Edge-Function-Secrets setzen:
//   - SEND_EMAIL_HOOK_SECRET (wie im Dashboard)
//   - SUPABASE_URL (für Aufruf der send-email Function)
//   - SUPABASE_ANON_KEY (Authorization-Header für send-email)
//   - INTERNAL_EMAIL_KEY (optional — wenn gesetzt, im x-internal-key
//     Header von send-email gefordert)
// ════════════════════════════════════════════════════════════════════

// @ts-ignore — Deno runtime
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';

// @ts-ignore
const HOOK_SECRET     = Deno.env.get('SEND_EMAIL_HOOK_SECRET');
// @ts-ignore
const SUPABASE_URL    = Deno.env.get('SUPABASE_URL');
// @ts-ignore
const ANON_KEY        = Deno.env.get('SUPABASE_ANON_KEY');
// @ts-ignore
const INTERNAL_KEY    = Deno.env.get('INTERNAL_EMAIL_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, webhook-id, webhook-timestamp, webhook-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

type AuthHookPayload = {
  user: {
    id: string;
    email: string;
    user_metadata?: { full_name?: string; sprache?: string };
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type:
      | 'signup'
      | 'login'
      | 'invite'
      | 'magiclink'
      | 'recovery'
      | 'email_change'
      | 'email_change_current'
      | 'email_change_new';
    site_url: string;
    token_new?: string;
    token_hash_new?: string;
  };
};

// ─────────────────────────────────────────────────────────────────
// Standard Supabase-Pattern für den Verifikations-Link.
// ─────────────────────────────────────────────────────────────────
function verifyUrl(p: AuthHookPayload, type: string): string {
  const u = new URL(`${p.email_data.site_url}/auth/v1/verify`);
  u.searchParams.set('token', p.email_data.token_hash);
  u.searchParams.set('type', type);
  u.searchParams.set('redirect_to', p.email_data.redirect_to);
  return u.toString();
}

// ─────────────────────────────────────────────────────────────────
// Mappt Auth-Event auf Template + Vars für send-email
// ─────────────────────────────────────────────────────────────────
type SendPayload = {
  template: 'verifizierung' | 'passwort_reset';
  to: string;
  vars: Record<string, unknown>;
  user_id?: string;
  subject_override?: string;
};

function buildSendPayload(p: AuthHookPayload): SendPayload {
  const fullName = p.user.user_metadata?.full_name ?? '';
  const action = p.email_data.email_action_type;

  if (action === 'recovery') {
    return {
      template: 'passwort_reset',
      to: p.user.email,
      vars: {
        name: fullName,
        resetUrl: verifyUrl(p, 'recovery'),
      },
      user_id: p.user.id,
    };
  }

  if (action === 'magiclink') {
    // Magic-Link wird wie Verifizierung gerendert (Subject angepasst)
    return {
      template: 'verifizierung',
      to: p.user.email,
      vars: {
        name: fullName,
        verifyUrl: verifyUrl(p, 'magiclink'),
      },
      user_id: p.user.id,
      subject_override: 'Dein Login-Link — passare',
    };
  }

  // signup / invite / email_change / Fallback: alle als Verifizierung
  const type = action === 'signup'
    ? 'signup'
    : action === 'invite'
      ? 'invite'
      : action;
  return {
    template: 'verifizierung',
    to: p.user.email,
    vars: {
      name: fullName,
      verifyUrl: verifyUrl(p, type),
    },
    user_id: p.user.id,
  };
}

// @ts-ignore — Deno
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }
  if (!HOOK_SECRET) {
    return json(500, { error: 'SEND_EMAIL_HOOK_SECRET nicht konfiguriert' });
  }
  if (!SUPABASE_URL || !ANON_KEY) {
    return json(500, { error: 'SUPABASE_URL / SUPABASE_ANON_KEY nicht konfiguriert' });
  }

  // Webhook-Signatur prüfen
  const rawBody = await req.text();
  let payload: AuthHookPayload;
  try {
    const headers: Record<string, string> = {};
    req.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });
    const secret = HOOK_SECRET.replace('v1,whsec_', '');
    const wh = new Webhook(secret);
    payload = wh.verify(rawBody, headers) as AuthHookPayload;
  } catch (err) {
    return json(401, { error: 'Webhook-Signatur ungültig', detail: String(err) });
  }

  const sendPayload = buildSendPayload(payload);

  // Weiterleiten an send-email Edge Function — selbe Templates,
  // selbes email_log, selbe Idempotenz wie alle anderen Mails.
  try {
    const headers: Record<string, string> = {
      'Content-Type':   'application/json',
      'Authorization':  `Bearer ${ANON_KEY}`,
      'apikey':         ANON_KEY,
    };
    if (INTERNAL_KEY) headers['x-internal-key'] = INTERNAL_KEY;

    const resp = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers,
      body: JSON.stringify(sendPayload),
    });
    const respBody = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      console.error('[auth-email-hook] send-email-Fehler:', resp.status, respBody);
      return json(502, { error: 'send-email-Versand fehlgeschlagen', detail: respBody });
    }
    return json(200, { ok: true, ...respBody });
  } catch (err) {
    return json(500, { error: 'Versand-Exception', detail: String(err) });
  }
});
