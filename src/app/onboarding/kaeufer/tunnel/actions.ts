'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { AGB_VERSION, DATENSCHUTZ_VERSION, type ActionResult } from '@/app/auth/constants';

const investorTypEnum = z.enum([
  'privatperson', 'family_office', 'holding_strategisch',
  'mbi_management', 'berater_broker',
]);
const timingEnum = z.enum([
  'sofort', '3_monate', '6_monate', '12_monate', 'nur_browsing',
]);
const erfahrungEnum = z.enum(['erstkaeufer', '1_3_deals', '4_plus_deals']);

const tunnelSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  kanton: z.string().length(2),
  investor_typ: investorTypEnum,
  branchen: z.string().transform((s) => s.split(',').filter(Boolean)).pipe(z.array(z.string()).max(5)),
  kantone: z.string().transform((s) => s.split(',').filter(Boolean)).pipe(z.array(z.string()).max(27)),
  budget_min: z.coerce.number().int().min(0).max(100_000_000).optional(),
  budget_max: z.coerce.number().int().min(0).max(100_000_000).optional(),
  budget_undisclosed: z.union([z.literal('on'), z.literal('true'), z.literal('false'), z.literal('')]).optional()
    .transform((v) => v === 'on' || v === 'true'),
  timing: timingEnum,
  erfahrung: erfahrungEnum,
  beschreibung: z.string().trim().max(2000).optional(),
  skip_suchprofil: z.union([z.literal('on'), z.literal('true'), z.literal('false'), z.literal('')]).optional()
    .transform((v) => v === 'on' || v === 'true'),
});

export async function submitKaeuferTunnelAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = tunnelSchema.safeParse({
    full_name: formData.get('full_name'),
    kanton: formData.get('kanton'),
    investor_typ: formData.get('investor_typ'),
    branchen: formData.get('branchen') ?? '',
    kantone: formData.get('kantone') ?? '',
    budget_min: formData.get('budget_min') || undefined,
    budget_max: formData.get('budget_max') || undefined,
    budget_undisclosed: formData.get('budget_undisclosed'),
    timing: formData.get('timing'),
    erfahrung: formData.get('erfahrung'),
    beschreibung: formData.get('beschreibung') || undefined,
    skip_suchprofil: formData.get('skip_suchprofil'),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Eingaben unvollständig' };
  }

  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return { ok: false, error: 'Nicht eingeloggt' };

  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const ua = h.get('user-agent') ?? null;

  // 1) Onboarding abschließen (rolle + name + kanton + AGB-Akzeptanz)
  const { error: rpcErr } = await supabase.rpc('complete_onboarding', {
    p_rolle: 'kaeufer',
    p_full_name: parsed.data.full_name,
    p_kanton: parsed.data.kanton.toUpperCase(),
    p_sprache: 'de',
    p_agb_version: AGB_VERSION,
    p_datenschutz_version: DATENSCHUTZ_VERSION,
    p_ip: ip,
    p_user_agent: ua,
  });

  if (rpcErr) {
    // Wenn rolle bereits gesetzt ist (Trigger-Schutz), kein Hard-Error — User kann Tunnel mehrfach durchlaufen
    if (!/rolle.*bereits|already set/i.test(rpcErr.message)) {
      return { ok: false, error: rpcErr.message };
    }
  }

  // 2) Käufer-Profil upsert
  const budget_min = parsed.data.budget_undisclosed ? null : (parsed.data.budget_min ?? null);
  const budget_max = parsed.data.budget_undisclosed ? null : (parsed.data.budget_max ?? null);

  const { error: profilErr } = await supabase
    .from('kaeufer_profil')
    .upsert(
      {
        user_id: u.user.id,
        investor_typ: parsed.data.investor_typ,
        budget_min,
        budget_max,
        budget_undisclosed: parsed.data.budget_undisclosed ?? false,
        regionen: parsed.data.kantone.length === 0 ? ['CH'] : parsed.data.kantone,
        branche_praeferenzen: parsed.data.branchen,
        timing: parsed.data.timing,
        erfahrung: parsed.data.erfahrung,
        beschreibung: parsed.data.beschreibung || null,
        ist_oeffentlich: true,
      },
      { onConflict: 'user_id' },
    );

  if (profilErr) {
    return { ok: false, error: `Profil konnte nicht gespeichert werden: ${profilErr.message}` };
  }

  // 3) Erstes Suchprofil automatisch anlegen (falls nicht übersprungen + falls noch keines existiert)
  if (!parsed.data.skip_suchprofil) {
    const { count } = await supabase
      .from('suchprofile')
      .select('*', { count: 'exact', head: true })
      .eq('kaeufer_id', u.user.id);

    if ((count ?? 0) === 0) {
      await supabase.from('suchprofile').insert({
        kaeufer_id: u.user.id,
        name: 'Mein erstes Suchprofil',
        branche: parsed.data.branchen,
        kantone: parsed.data.kantone,
        umsatz_min: budget_min ? Math.round(budget_min / 4) : null,  // Faustregel: Budget = 4× Umsatz
        umsatz_max: budget_max ? Math.round(budget_max / 2) : null,
        ebitda_min: null,
        ma_min: null,
        ma_max: null,
        gruende: [],
        email_alert: true,
        whatsapp_alert: false,
        push_alert: false,
        ist_pausiert: false,
      });
    }
  }

  revalidatePath('/', 'layout');
  redirect('/onboarding/kaeufer/paket');
}
