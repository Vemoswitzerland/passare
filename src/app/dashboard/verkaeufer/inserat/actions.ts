'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

/**
 * Übernimmt Pre-Reg-Cookie (vom Funnel /verkaufen/start) in ein neues Inserat.
 * Wird im /dashboard/verkaeufer/inserat/new Server-Component aufgerufen.
 */
export async function takeOverPreRegDraft(): Promise<string | null> {
  const cookieStore = await cookies();
  const draftRaw = cookieStore.get('pre_reg_draft')?.value;
  if (!draftRaw) return null;

  let draft: any;
  try {
    draft = JSON.parse(draftRaw);
  } catch {
    return null;
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  // Check ob bereits ein Inserat aus diesem Draft existiert
  const { data: existing } = await supabase
    .from('inserate')
    .select('id, zefix_uid')
    .eq('owner_id', userData.user.id)
    .eq('status', 'entwurf')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing && existing.zefix_uid && existing.zefix_uid === draft.zefix_uid) {
    cookieStore.set('pre_reg_draft', '', { maxAge: 0, path: '/' });
    return existing.id;
  }

  const { data, error } = await supabase.rpc('create_inserat_from_pre_reg', {
    p: {
      zefix_uid: draft.zefix_uid,
      firma_name: draft.firma_name,
      firma_rechtsform: draft.firma_rechtsform,
      firma_sitz_gemeinde: draft.firma_sitz_gemeinde,
      branche_id: draft.branche_id,
      kanton: draft.kanton,
      jahr: draft.jahr,
      mitarbeitende: draft.mitarbeitende,
      umsatz: draft.umsatz,
      ebitda: draft.ebitda,
      valuation: draft.valuation,
    },
  });

  // Cookie löschen nach erfolgreichem Übertrag
  cookieStore.set('pre_reg_draft', '', { maxAge: 0, path: '/' });

  if (error) {
    console.error('[pre-reg-takeover]', error);
    return null;
  }
  return data as string;
}

/** Step-Save (Auto-Save vom Wizard). */
export async function saveStep(
  inseratId: string,
  step: number,
  data: Record<string, unknown>,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('submit_inserat_step', {
    p_id: inseratId,
    p_step: step,
    p_data: data,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/dashboard/verkaeufer/inserat');
  return { ok: true, id: inseratId };
}

/** Inserat löschen (nur Entwurf erlaubt durch RLS). */
export async function deleteInserat(inseratId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('inserate').delete().eq('id', inseratId);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/dashboard/verkaeufer');
  return { ok: true };
}

/** Inserat-Status setzen (pausieren/wieder live/verkauft). */
export async function setInseratStatus(
  inseratId: string,
  status: 'pausiert' | 'live' | 'verkauft',
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('inserate')
    .update({ status })
    .eq('id', inseratId);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/dashboard/verkaeufer');
  return { ok: true };
}

/** Inserat zur Prüfung einreichen (publish_inserat RPC). */
export async function submitForReview(inseratId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('publish_inserat', { p_id: inseratId });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/dashboard/verkaeufer');
  return { ok: true };
}

/** Mock-Stripe Checkout — markiert Inserat als bezahlt + setzt Paket. */
export async function mockPaketKaufen(
  inseratId: string,
  paket: 'light' | 'pro' | 'premium',
): Promise<ActionResult> {
  const supabase = await createClient();
  const monthsMap = { light: 3, pro: 6, premium: 12 };
  const months = monthsMap[paket];
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + months);

  const { error } = await supabase
    .from('inserate')
    .update({
      paket,
      paid_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      stripe_session_id: `mock_${Date.now()}`,
    })
    .eq('id', inseratId);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/dashboard/verkaeufer');
  return { ok: true };
}
