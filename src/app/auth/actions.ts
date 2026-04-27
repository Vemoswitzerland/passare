'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

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
  .max(72, 'Maximal 72 Zeichen');

const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    full_name: z.string().trim().min(2, 'Name erforderlich').max(120),
    sprache: z.enum(['de', 'fr', 'it', 'en']).default('de'),
    accept_terms: z
      .union([z.literal('on'), z.literal('true'), z.literal(true)])
      .transform(() => true),
  })
  .strict();

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

export type ActionResult = { ok: true } | { ok: false; error: string };

// ═══════════════════════════════════════════════════════════════
//  REGISTRIERUNG
// ═══════════════════════════════════════════════════════════════
export async function registerAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    full_name: formData.get('full_name'),
    sprache: (formData.get('sprache') as string) || 'de',
    accept_terms: formData.get('accept_terms'),
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

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        full_name: parsed.data.full_name,
        sprache: parsed.data.sprache,
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

// ═══════════════════════════════════════════════════════════════
//  LOGOUT
// ═══════════════════════════════════════════════════════════════
export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
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
