// ════════════════════════════════════════════════════════════════════
// Edge Function: auth-email-hook
// ────────────────────────────────────────────────────────────────────
// Wird von Supabase Auth via "Send Email Hook" aufgerufen wenn ein
// Auth-Event eine Mail erfordert (Signup-Verify, Password-Reset,
// Magic-Link, Email-Change). Wir leiten an Resend weiter, damit der
// Versand nicht über den restriktiven Default-SMTP geht.
//
// Setup im Supabase Dashboard:
//   Authentication → Hooks → Send Email Hook
//   - Type: HTTPS
//   - URL: https://<project>.supabase.co/functions/v1/auth-email-hook
//   - Secret: <SEND_EMAIL_HOOK_SECRET ENV var, beginnt mit v1,whsec_>
//
// ENV-Vars in Edge-Function-Secrets setzen:
//   - RESEND_API_KEY
//   - SEND_EMAIL_HOOK_SECRET (wie im Dashboard)
//   - EMAIL_FROM (default: passare <noreply@passare.ch>)
//
// Standard-Library: "https://esm.sh/standardwebhooks@1.0.0" für die
// Webhook-Signatur-Verifikation (Supabase nutzt das Schema).
// ════════════════════════════════════════════════════════════════════

// @ts-ignore — Deno runtime
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';

// @ts-ignore
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
// @ts-ignore
const HOOK_SECRET    = Deno.env.get('SEND_EMAIL_HOOK_SECRET');
// @ts-ignore
const FROM           = Deno.env.get('EMAIL_FROM')      ?? 'passare <noreply@passare.ch>';
// @ts-ignore
const REPLY_TO       = Deno.env.get('EMAIL_REPLY_TO')  ?? 'info@passare.ch';

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
// Templates — minimal, inline. Wer was Aufwendigeres will, ruft die
// send-email-Function mit dem entsprechenden Template auf.
// ─────────────────────────────────────────────────────────────────

function verifyUrl(p: AuthHookPayload, type: string): string {
  // Standard Supabase-Pattern für den Verifikations-Link
  const u = new URL(`${p.email_data.site_url}/auth/v1/verify`);
  u.searchParams.set('token', p.email_data.token_hash);
  u.searchParams.set('type', type);
  u.searchParams.set('redirect_to', p.email_data.redirect_to);
  return u.toString();
}

function escape(s: string): string {
  return s.replace(/[<>&"']/g, (c) => (
    { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]!
  ));
}

function htmlShell(title: string, body: string): string {
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)}</title>
</head>
<body style="margin:0;padding:0;background:#FAF8F3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0A0F12;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#FAF8F3;">
  <tr><td align="center" style="padding:40px 16px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="background:#FFFFFF;border:1px solid #E8E6E0;border-radius:12px;">
      <tr><td style="padding:40px;">
        <p style="margin:0 0 24px;font-family:Georgia,serif;font-size:24px;color:#0B1F3A;letter-spacing:-0.01em;">passare<span style="color:#B8935A">.</span></p>
        ${body}
      </td></tr>
    </table>
    <p style="margin:24px 0 0;font-size:12px;color:#8A9099;">passare AG · Schweizer Marktplatz für KMU-Nachfolge</p>
  </td></tr>
</table>
</body>
</html>`;
}

function buildEmail(p: AuthHookPayload): { subject: string; html: string } {
  const fullName = p.user.user_metadata?.full_name ?? '';
  const greeting = fullName ? `Hallo ${escape(fullName)},` : 'Hallo,';
  const action = p.email_data.email_action_type;

  if (action === 'signup' || action === 'invite') {
    const url = verifyUrl(p, action === 'signup' ? 'signup' : 'invite');
    return {
      subject: 'Bitte bestätige deine E-Mail — passare',
      html: htmlShell('E-Mail bestätigen',
        `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;">${greeting}</p>
         <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">
           willkommen bei passare. Bitte bestätige deine E-Mail-Adresse —
           damit wir sicher sein können, dass das wirklich du bist.
         </p>
         <p style="margin:0 0 32px;text-align:center;">
           <a href="${url}" style="display:inline-block;background:#0B1F3A;color:#FAF8F3;text-decoration:none;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:500;">E-Mail bestätigen</a>
         </p>
         <p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:#5A6471;">
           Falls der Knopf nicht funktioniert, kopiere diesen Link in den Browser:
         </p>
         <p style="margin:0 0 24px;font-size:12px;line-height:1.5;color:#8A9099;word-break:break-all;font-family:Monaco,Consolas,monospace;">
           ${escape(url)}
         </p>
         <p style="margin:0;font-size:13px;color:#8A9099;">
           Diese E-Mail wurde von passare verschickt, weil du dich registriert hast.
           Wenn das nicht von dir kam, kannst du diese Mail einfach ignorieren.
         </p>`),
    };
  }

  if (action === 'recovery') {
    const url = verifyUrl(p, 'recovery');
    return {
      subject: 'Passwort zurücksetzen — passare',
      html: htmlShell('Passwort zurücksetzen',
        `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;">${greeting}</p>
         <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">
           du hast angefordert, dein Passwort zurückzusetzen. Klicke auf
           den Knopf um ein neues zu wählen.
         </p>
         <p style="margin:0 0 32px;text-align:center;">
           <a href="${url}" style="display:inline-block;background:#0B1F3A;color:#FAF8F3;text-decoration:none;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:500;">Neues Passwort wählen</a>
         </p>
         <p style="margin:0;font-size:13px;color:#8A9099;">
           Wenn du das nicht angefordert hast, kannst du diese Mail ignorieren.
           Dein Passwort bleibt unverändert.
         </p>`),
    };
  }

  if (action === 'magiclink') {
    const url = verifyUrl(p, 'magiclink');
    return {
      subject: 'Dein Login-Link — passare',
      html: htmlShell('Login-Link',
        `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;">${greeting}</p>
         <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">
           hier ist dein Login-Link für passare:
         </p>
         <p style="margin:0 0 32px;text-align:center;">
           <a href="${url}" style="display:inline-block;background:#0B1F3A;color:#FAF8F3;text-decoration:none;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:500;">Jetzt einloggen</a>
         </p>`),
    };
  }

  // Fallback: email_change und andere
  const url = verifyUrl(p, action);
  return {
    subject: 'Bitte bestätigen — passare',
    html: htmlShell('Bestätigung erforderlich',
      `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;">${greeting}</p>
       <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">
         bitte bestätige folgende Aktion mit einem Klick auf den Knopf:
       </p>
       <p style="margin:0 0 32px;text-align:center;">
         <a href="${url}" style="display:inline-block;background:#0B1F3A;color:#FAF8F3;text-decoration:none;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:500;">Bestätigen</a>
       </p>`),
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
  if (!RESEND_API_KEY) {
    return json(500, { error: 'RESEND_API_KEY nicht konfiguriert' });
  }
  if (!HOOK_SECRET) {
    return json(500, { error: 'SEND_EMAIL_HOOK_SECRET nicht konfiguriert' });
  }

  // Webhook-Signatur prüfen
  const rawBody = await req.text();
  let payload: AuthHookPayload;
  try {
    const headers: Record<string, string> = {};
    req.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });
    // Hook-Secret ist als Base64 im Format "v1,whsec_<base64>" — Standardwebhooks
    // nimmt nur den Base64-Teil
    const secret = HOOK_SECRET.replace('v1,whsec_', '');
    const wh = new Webhook(secret);
    payload = wh.verify(rawBody, headers) as AuthHookPayload;
  } catch (err) {
    return json(401, { error: 'Webhook-Signatur ungültig', detail: String(err) });
  }

  const { subject, html } = buildEmail(payload);

  // Resend-Call
  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from:     FROM,
        to:       [payload.user.email],
        reply_to: REPLY_TO,
        subject,
        html,
      }),
    });
    const respBody = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      console.error('[auth-email-hook] Resend-Fehler:', resp.status, respBody);
      return json(502, { error: 'Resend-Versand fehlgeschlagen', detail: respBody });
    }
    return json(200, { ok: true, resend_id: respBody.id });
  } catch (err) {
    return json(500, { error: 'Versand-Exception', detail: String(err) });
  }
});
