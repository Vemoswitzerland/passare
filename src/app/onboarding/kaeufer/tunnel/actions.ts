'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { AGB_VERSION, DATENSCHUTZ_VERSION, type ActionResult } from '@/app/auth/constants';
import { sendEmail } from '@/lib/email';

const investorTypEnum = z.enum([
  'privatperson', 'family_office', 'holding_strategisch',
  'mbi_management', 'berater_broker',
]);

/**
 * Schlankes Schema — alles ausser Branchen/Kantone optional damit
 * der User möglichst schnell durchkommt.
 */
const tunnelSchema = z.object({
  branchen: z.string().transform((s) => s.split(',').filter(Boolean)).pipe(z.array(z.string()).max(20)),
  kantone:  z.string().transform((s) => s.split(',').filter(Boolean)).pipe(z.array(z.string()).max(27)),
  investor_typ: investorTypEnum.optional(),
  budget_min: z.coerce.number().int().min(0).max(100_000_000).optional().or(z.literal(NaN).transform(() => undefined)),
  budget_max: z.coerce.number().int().min(0).max(100_000_000).optional().or(z.literal(NaN).transform(() => undefined)),
  budget_undisclosed: z.string().optional().transform((v) => v === 'on' || v === 'true'),
  beschreibung: z.string().trim().max(2000).optional(),
});

async function ensureKaeuferRolle(userId: string) {
  const supabase = await createClient();
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const ua = h.get('user-agent') ?? null;

  // Profile checken — wenn rolle bereits gesetzt UND onboarding done: skip RPC
  const { data: profile } = await supabase
    .from('profiles')
    .select('rolle, full_name, kanton, sprache, onboarding_completed_at')
    .eq('id', userId)
    .maybeSingle();

  if (!profile) return { ok: false as const, error: 'Profil nicht gefunden' };

  // Wenn schon Käufer + onboarded: alles OK, kein RPC nötig
  if (profile.rolle === 'kaeufer' && profile.onboarding_completed_at) return { ok: true as const };

  // Wenn schon admin: nicht überschreiben — Tunnel funktioniert für Admin-Test trotzdem
  if (profile.rolle === 'admin') return { ok: true as const };

  // Sonst: complete_onboarding aufrufen
  const { error: rpcErr } = await supabase.rpc('complete_onboarding', {
    p_rolle: 'kaeufer',
    p_full_name: profile.full_name ?? 'Käufer',
    p_kanton: (profile.kanton ?? 'ZH').toUpperCase(),
    p_sprache: profile.sprache ?? 'de',
    p_agb_version: AGB_VERSION,
    p_datenschutz_version: DATENSCHUTZ_VERSION,
    p_ip: ip,
    p_user_agent: ua,
  });

  if (rpcErr) {
    // "Rolle bereits gesetzt" ignorieren — wir wollen trotzdem weiter
    if (!/rolle.*bereits|already set|protect_rolle/i.test(rpcErr.message)) {
      return { ok: false as const, error: rpcErr.message };
    }
  }
  return { ok: true as const };
}

export async function submitKaeuferTunnelAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = tunnelSchema.safeParse({
    branchen: formData.get('branchen') ?? '',
    kantone:  formData.get('kantone') ?? '',
    investor_typ: formData.get('investor_typ') || undefined,
    budget_min: formData.get('budget_min') || undefined,
    budget_max: formData.get('budget_max') || undefined,
    budget_undisclosed: (formData.get('budget_undisclosed') as string) ?? '',
    beschreibung: formData.get('beschreibung') || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Eingaben prüfen' };
  }

  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return { ok: false, error: 'Nicht eingeloggt' };

  // 1) Sicherstellen dass Käufer-Rolle gesetzt ist
  const roleResult = await ensureKaeuferRolle(u.user.id);
  if (!roleResult.ok) return roleResult;

  // 2) Käufer-Profil upsert (defensive — falls Tabelle noch nicht existiert, weiter)
  const undisclosed = parsed.data.budget_undisclosed ?? false;
  const budget_min = undisclosed ? null : (parsed.data.budget_min ?? null);
  const budget_max = undisclosed ? null : (parsed.data.budget_max ?? null);

  const { error: profilErr } = await supabase
    .from('kaeufer_profil')
    .upsert(
      {
        user_id: u.user.id,
        investor_typ: parsed.data.investor_typ ?? null,
        budget_min,
        budget_max,
        budget_undisclosed: undisclosed,
        regionen: parsed.data.kantone.length === 0 ? ['CH'] : parsed.data.kantone,
        branche_praeferenzen: parsed.data.branchen,
        beschreibung: parsed.data.beschreibung || null,
        ist_oeffentlich: true,
      },
      { onConflict: 'user_id' },
    );

  // Tabelle fehlt (Migration nicht applied) — egal, wir lassen User trotzdem weiter
  if (profilErr && !/relation.*does not exist|42P01/i.test(profilErr.message)) {
    return { ok: false, error: `Profil konnte nicht gespeichert werden: ${profilErr.message}` };
  }

  // 3) Erstes Suchprofil anlegen — defensive
  const { count } = await supabase
    .from('suchprofile')
    .select('*', { count: 'exact', head: true })
    .eq('kaeufer_id', u.user.id);

  if ((count ?? 0) === 0 && parsed.data.branchen.length > 0) {
    const { error: spErr } = await supabase.from('suchprofile').insert({
      kaeufer_id: u.user.id,
      name: 'Mein erstes Suchprofil',
      branche: parsed.data.branchen,
      kantone: parsed.data.kantone,
      umsatz_min: budget_min ? Math.round(budget_min / 4) : null,
      umsatz_max: budget_max ? Math.round(budget_max / 2) : null,
      email_alert: true,
      ist_pausiert: false,
    });
    if (spErr && !/relation.*does not exist|42P01/i.test(spErr.message)) {
      // Suchprofil-Fehler nicht fatal
      console.warn('[tunnel] suchprofil insert:', spErr.message);
    }
  }

  // 4) Welcome-Email (fire-and-forget)
  if (u.user.email) {
    void sendEmail({
      template: 'welcome',
      to: u.user.email,
      vars: { rolle: 'kaeufer', branchen: parsed.data.branchen },
      user_id: u.user.id,
    });
  }

  revalidatePath('/', 'layout');
  redirect('/onboarding/kaeufer/paket');
}

/**
 * Skip-Tunnel: User klickt «Überspringen → Free-Version».
 * Setzt Käufer-Rolle, KEIN Suchprofil, KEIN Käufer-Profil.
 * Geht direkt zum Dashboard mit Basic-Tier.
 */
export async function skipKaeuferTunnelAction() {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) redirect('/auth/login');

  await ensureKaeuferRolle(u.user.id);

  // Welcome-Email auch beim Skip
  if (u.user.email) {
    void sendEmail({
      template: 'welcome',
      to: u.user.email,
      vars: { rolle: 'kaeufer', skipped: true },
      user_id: u.user.id,
    });
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard/kaeufer?welcome=skipped');
}
