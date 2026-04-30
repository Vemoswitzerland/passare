'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

/**
 * Actions für Verkäufer-Anfrage-Detail.
 * Pro-Abo-Gate: dossier-Request + datenraum-Grant gehen nur wenn der
 * Verkäufer (= owner des Inserats) Pro oder Premium gebucht hat.
 */

async function ownsAnfrage(anfrageId: string): Promise<{
  ok: boolean;
  reason?: string;
  paket?: string | null;
  inseratId?: string;
  kaeuferId?: string;
}> {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return { ok: false, reason: 'Nicht eingeloggt' };

  const { data: anfrage } = await supabase
    .from('anfragen')
    .select('id, inserat_id, kaeufer_id, inserate(verkaeufer_id, paket)')
    .eq('id', anfrageId)
    .maybeSingle();

  if (!anfrage) return { ok: false, reason: 'Anfrage nicht gefunden' };

  const inserate = anfrage.inserate as { verkaeufer_id?: string; paket?: string | null } | null;
  if (inserate?.verkaeufer_id !== u.user.id) {
    return { ok: false, reason: 'Keine Berechtigung' };
  }
  return {
    ok: true,
    paket: inserate?.paket ?? null,
    inseratId: anfrage.inserat_id as string,
    kaeuferId: anfrage.kaeufer_id as string,
  };
}

export async function requestKaeuferDossier(
  anfrageId: string,
  message: string,
): Promise<{ ok: boolean; error?: string }> {
  const own = await ownsAnfrage(anfrageId);
  if (!own.ok) return { ok: false, error: own.reason };
  // Pro/Premium-Gate
  if (!['pro', 'premium'].includes(own.paket ?? '')) {
    return { ok: false, error: 'Käuferdossier-Anfrage benötigt Pro oder Premium-Paket.' };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from('anfragen')
    .update({
      dossier_requested_at: new Date().toISOString(),
      dossier_request_message: message.trim().slice(0, 500) || null,
    })
    .eq('id', anfrageId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/dashboard/verkaeufer/anfragen/${anfrageId}`);
  return { ok: true };
}

export async function grantDatenraumAccess(
  anfrageId: string,
): Promise<{ ok: boolean; error?: string }> {
  const own = await ownsAnfrage(anfrageId);
  if (!own.ok) return { ok: false, error: own.reason };
  if (!['pro', 'premium'].includes(own.paket ?? '')) {
    return { ok: false, error: 'Datenraum-Freigabe benötigt Pro oder Premium-Paket.' };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from('anfragen')
    .update({ datenraum_granted_at: new Date().toISOString() })
    .eq('id', anfrageId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/dashboard/verkaeufer/anfragen/${anfrageId}`);
  return { ok: true };
}

export async function revokeDatenraumAccess(
  anfrageId: string,
): Promise<{ ok: boolean; error?: string }> {
  const own = await ownsAnfrage(anfrageId);
  if (!own.ok) return { ok: false, error: own.reason };
  const supabase = await createClient();
  const { error } = await supabase
    .from('anfragen')
    .update({ datenraum_granted_at: null })
    .eq('id', anfrageId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/dashboard/verkaeufer/anfragen/${anfrageId}`);
  return { ok: true };
}
