/**
 * Email-Helper für passare.
 *
 * Wrapper um die Supabase Edge-Function `send-email` (siehe
 * `supabase/functions/send-email/index.ts`). Templates sind in
 * `/emails/*.tsx` definiert. Versand läuft über Resend.
 *
 * Fire-and-forget: wenn Email-Versand fehlschlägt, blockt das die
 * eigentliche User-Action NICHT.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// Template-Namen wie in supabase/functions/_shared/render.ts (snake_case).
export type EmailTemplate =
  | 'welcome'
  | 'verifizierung'
  | 'passwort_reset'
  | 'alert_neues_inserat'
  | 'nda_signiert'
  | 'zahlung_bestaetigung'
  | 'anfrage_eingegangen'
  | 'anfrage_beantwortet'
  | 'inserat_bald_abgelaufen';

type SendEmailParams = {
  template: EmailTemplate;
  to: string;
  vars?: Record<string, unknown>;
  user_id?: string;
  related_id?: string;
  subject_override?: string;
};

/**
 * Sendet eine Email via Edge-Function. Fire-and-forget — wirft niemals.
 * Logged Fehler nur in die Server-Console.
 */
export async function sendEmail(params: SendEmailParams): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    console.warn('[email] Supabase nicht konfiguriert — kein Versand');
    return;
  }

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
      },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      console.warn(`[email] Versand fehlgeschlagen (${res.status}): ${txt}`);
    }
  } catch (err) {
    console.warn('[email] Versand-Exception:', err);
  }
}

/**
 * Sendet die Welcome-Mail an einen User GENAU EINMAL.
 *
 * Mechanik (atomic, race-safe):
 *   - RPC `claim_welcome_send(user_id)` macht ein atomic UPDATE
 *     auf profiles.welcome_email_sent_at. Wenn die Spalte noch null
 *     war, gibt's true zurück → wir senden. Wenn schon gesetzt:
 *     false → skip.
 *   - Damit ist es egal ob 5 parallele Requests reinkommen — nur
 *     EINER bekommt das Claim, die anderen 4 skippen.
 *
 * Fallback: wenn die RPC fehlt (Migration nicht applied) ODER der
 * RPC-Call sonst fehlschlägt, senden wir trotzdem (best-effort) damit
 * Bestandsuser nicht ohne Mail bleiben.
 */
export async function sendWelcomeOnce(
  supabase: SupabaseClient,
  userId: string,
  email: string,
  vars: Record<string, unknown> = {},
): Promise<void> {
  if (!email) return;

  let maySend = true;
  try {
    const { data, error } = await supabase.rpc('claim_welcome_send', {
      p_user_id: userId,
    });
    if (error) {
      const msg = error.message ?? '';
      const fnMissing = /function.*does not exist|42883|claim_welcome_send/i.test(msg);
      if (!fnMissing) {
        console.warn('[welcome-once] RPC-Fehler:', msg);
      }
      // Bei Fehler: trotzdem senden (defensive)
      maySend = true;
    } else {
      maySend = data === true;
    }
  } catch (err) {
    console.warn('[welcome-once] RPC-Exception:', err);
    maySend = true;
  }

  if (!maySend) return;

  await sendEmail({
    template: 'welcome',
    to: email,
    vars,
    user_id: userId,
  });
}
