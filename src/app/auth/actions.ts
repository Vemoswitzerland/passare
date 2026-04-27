'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers, cookies } from 'next/headers';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { AGB_VERSION, DATENSCHUTZ_VERSION, KANTONE, type ActionResult } from './constants';

const VALID_KANTON = new Set(KANTONE.map(([c]) => c));

// ─── Schemas ──────────────────────────────────────────────────
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(5, 'E-Mail erforderlich')
  .email('E-Mail ungültig');

const passwordSchema = z
  .string()
  .min(8, 'Mindestens 8 Zeichen')
  .max(72, 'Maximal 72 Zeichen')
  .refine((p) => /[a-z]/.test(p), 'Mindestens 1 Kleinbuchstabe (a-z)')
  .refine((p) => /[A-Z]/.test(p), 'Mindestens 1 Grossbuchstabe (A-Z)')
  .refine((p) => /[0-9]/.test(p), 'Mindestens 1 Ziffer (0-9)')
  .refine((p) => /[^A-Za-z0-9]/.test(p), 'Mindestens 1 Sonderzeichen (!@#$…)');

const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirm: z.string(),
    full_name: z.string().trim().min(2, 'Name erforderlich').max(120),
    sprache: z.enum(['de', 'fr', 'it', 'en']).default('de'),
    accept_terms: z
      .union([z.literal('on'), z.literal('true'), z.literal(true)])
      .transform(() => true),
    intended_role: z.enum(['kaeufer', 'verkaeufer']).optional(),
    next: z.string().optional(),
  })
  .strict()
  .refine((d) => d.password === d.confirm, {
    message: 'Passwörter stimmen nicht überein',
    path: ['confirm'],
  });

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Passwort erforderlich'),
});

const resetRequestSchema = z.object({ email: emailSchema });

const resetUpdateSchema = z
  .object({
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwörter stimmen nicht überein',
    path: ['confirm'],
  });

// ─── Hilfsfunktion: Origin für Redirect-URLs ──────────────────
async function getAppOrigin() {
  const env = process.env.NEXT_PUBLIC_APP_URL;
  if (env) return env.replace(/\/$/, '');
  const h = await headers();
  const proto = h.get('x-forwarded-proto') ?? 'https';
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'passare-ch.vercel.app';
  return `${proto}://${host}`;
}

// ═══════════════════════════════════════════════════════════════
//  REGISTRIERUNG
// ═══════════════════════════════════════════════════════════════
export async function registerAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    confirm: formData.get('confirm'),
    full_name: formData.get('full_name'),
    sprache: (formData.get('sprache') as string) || 'de',
    accept_terms: formData.get('accept_terms'),
    intended_role: formData.get('intended_role') || undefined,
    next: formData.get('next') || undefined,
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? 'Eingaben unvollständig' };
  }

  if (!parsed.data.accept_terms) {
    return { ok: false, error: 'Bitte AGB & Datenschutz akzeptieren' };
  }

  const supabase = await createClient();
  const origin = await getAppOrigin();

  // Nach Bestätigungs-Mail-Klick wollen wir Käufer direkt in den Tunnel routen
  const callbackNext = parsed.data.intended_role === 'kaeufer'
    ? '/onboarding/kaeufer/tunnel'
    : parsed.data.next || '';

  const callbackUrl = `${origin}/auth/callback${callbackNext ? `?next=${encodeURIComponent(callbackNext)}` : ''}`;

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: callbackUrl,
      data: {
        full_name: parsed.data.full_name,
        sprache: parsed.data.sprache,
        intended_role: parsed.data.intended_role,
      },
    },
  });

  if (error) {
    return { ok: false, error: translateAuthError(error.message) };
  }

  redirect(`/auth/check-email?email=${encodeURIComponent(parsed.data.email)}`);
}

// ═══════════════════════════════════════════════════════════════
//  LOGIN
// ═══════════════════════════════════════════════════════════════
export async function loginAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Eingaben unvollständig' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { ok: false, error: translateAuthError(error.message) };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

// ═══════════════════════════════════════════════════════════════
//  PASSWORT-RESET ANFORDERN
// ═══════════════════════════════════════════════════════════════
export async function requestResetAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = resetRequestSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'E-Mail ungültig' };
  }

  const supabase = await createClient();
  const origin = await getAppOrigin();

  // Wir geben IMMER ok zurück, damit kein User-Enumeration-Leak entsteht.
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/reset/confirm`,
  });

  return { ok: true };
}

// ═══════════════════════════════════════════════════════════════
//  PASSWORT NEU SETZEN (eingeloggter Recovery-Session-User)
// ═══════════════════════════════════════════════════════════════
export async function updatePasswordAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = resetUpdateSchema.safeParse({
    password: formData.get('password'),
    confirm: formData.get('confirm'),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Passwort ungültig' };
  }

  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) {
    return { ok: false, error: 'Recovery-Link ist abgelaufen. Bitte neu anfordern.' };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { ok: false, error: translateAuthError(error.message) };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard?reset=ok');
}

// OAuth-Flow läuft client-side (PKCE-Verifier muss im Browser-Cookie liegen).
// Siehe src/components/ui/oauth-buttons.tsx

// ═══════════════════════════════════════════════════════════════
//  LOGOUT
// ═══════════════════════════════════════════════════════════════
export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}

// ═══════════════════════════════════════════════════════════════
//  ONBOARDING — atomare Completion via RPC
// ═══════════════════════════════════════════════════════════════
const onboardingSchema = z.object({
  rolle: z.enum(['verkaeufer', 'kaeufer']),
  full_name: z.string().trim().min(2, 'Name erforderlich').max(120),
  kanton: z.string().length(2, 'Kanton ungültig'),
  sprache: z.enum(['de', 'fr', 'it', 'en']).default('de'),
  accept_agb: z.union([z.literal('on'), z.literal('true'), z.literal(true)]),
  accept_datenschutz: z.union([z.literal('on'), z.literal('true'), z.literal(true)]),
});

export async function completeOnboardingAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = onboardingSchema.safeParse({
    rolle: formData.get('rolle'),
    full_name: formData.get('full_name'),
    kanton: formData.get('kanton'),
    sprache: formData.get('sprache') ?? 'de',
    accept_agb: formData.get('accept_agb'),
    accept_datenschutz: formData.get('accept_datenschutz'),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Eingaben unvollständig' };
  }

  const kantonUpper = parsed.data.kanton.toUpperCase();
  if (!VALID_KANTON.has(kantonUpper as (typeof KANTONE)[number][0])) {
    return { ok: false, error: 'Bitte einen Schweizer Kanton wählen' };
  }

  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return { ok: false, error: 'Nicht eingeloggt' };

  // IP + User-Agent für Audit-Trail (terms_acceptances)
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const ua = h.get('user-agent') ?? null;

  const { error } = await supabase.rpc('complete_onboarding', {
    p_rolle: parsed.data.rolle,
    p_full_name: parsed.data.full_name,
    p_kanton: kantonUpper,
    p_sprache: parsed.data.sprache,
    p_agb_version: AGB_VERSION,
    p_datenschutz_version: DATENSCHUTZ_VERSION,
    p_ip: ip,
    p_user_agent: ua,
  });

  if (error) return { ok: false, error: error.message };

  // Pre-Reg-Funnel: Bei Verkäufern Cookie auslesen + Inserat-Draft anlegen
  if (parsed.data.rolle === 'verkaeufer') {
    try {
      const cookieStore = await cookies();
      const draftCookie = cookieStore.get('pre_reg_draft')?.value;
      if (draftCookie) {
        const draft = JSON.parse(draftCookie);
        const { data: inserat, error: rpcErr } = await supabase.rpc('create_inserat_from_pre_reg', {
          p: draft,
        });
        cookieStore.set('pre_reg_draft', '', { maxAge: 0, path: '/' });
        if (!rpcErr && inserat) {
          revalidatePath('/', 'layout');
          redirect(`/dashboard/verkaeufer/inserat/${inserat}/edit?from=pre-reg`);
        }
      }
    } catch {
      // Fallback: normaler Dashboard-Redirect
    }
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard?welcome=1');
}

// ─── Fehlertexte deutsch ──────────────────────────────────────
function translateAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login credentials')) return 'E-Mail oder Passwort falsch';
  if (m.includes('email not confirmed')) return 'Bitte zuerst E-Mail bestätigen';
  if (m.includes('user already registered')) return 'Diese E-Mail ist bereits registriert';
  if (m.includes('rate limit') || m.includes('over_email_send_rate'))
    return 'Zu viele Versuche — bitte später erneut versuchen';
  if (m.includes('password should be at least')) return 'Passwort zu kurz (min. 8 Zeichen)';
  if (m.includes('weak password')) return 'Passwort zu schwach';
  if (m.includes('signups not allowed')) return 'Registrierung derzeit nicht möglich';
  return msg;
}
