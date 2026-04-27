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

export type EmailTemplate =
  | 'EmailWelcome'
  | 'EmailVerifizierung'
  | 'EmailPasswortReset'
  | 'EmailAlertNeuesInserat'
  | 'EmailNDASigniert'
  | 'EmailZahlungBestaetigung'
  | 'EmailAnfrageEingegangen'
  | 'EmailAnfrageBeantwortet'
  | 'EmailInseratBaldAbgelaufen';

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
