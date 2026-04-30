'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function setAnfrageStatus(
  anfrageId: string,
  status: 'akzeptiert' | 'abgelehnt' | 'released' | 'geschlossen' | 'nda_pending',
  reason?: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('update_anfrage_status', {
    p_id: anfrageId,
    p_status: status,
    p_reason: reason ?? null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/dashboard/verkaeufer/anfragen');
  revalidatePath('/dashboard/verkaeufer/nda');
  return { ok: true };
}

/**
 * Verkäufer (oder Käufer) schickt eine Nachricht im Anfragen-Chat.
 *
 * Cyrill 30.04.2026: «Konversation soll als Thread unter Anfragen
 * laufen — Käufer und Verkäufer schreiben sich direkt, mit Inserat-
 * Tag im Chat-Header.» RLS regelt wer schreiben darf.
 */
export async function sendAnfrageMessage(
  anfrageId: string,
  message: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return { ok: false, error: 'Nicht angemeldet.' };

  const trimmed = message.trim();
  if (trimmed.length < 1) return { ok: false, error: 'Leere Nachricht.' };
  if (trimmed.length > 4000) return { ok: false, error: 'Zu lang (max 4000 Zeichen).' };

  // Rolle ermitteln: Käufer der Anfrage, Verkäufer des Inserats oder Admin
  const { data: anf } = await supabase
    .from('anfragen')
    .select('id, kaeufer_id, inserat_id')
    .eq('id', anfrageId)
    .maybeSingle();
  if (!anf) return { ok: false, error: 'Anfrage nicht gefunden.' };

  let role: 'kaeufer' | 'verkaeufer' | 'admin' | null = null;
  if ((anf.kaeufer_id as string) === u.user.id) {
    role = 'kaeufer';
  } else {
    const { data: ins } = await supabase
      .from('inserate')
      .select('verkaeufer_id')
      .eq('id', anf.inserat_id as string)
      .maybeSingle();
    if ((ins?.verkaeufer_id as string | undefined) === u.user.id) {
      role = 'verkaeufer';
    } else {
      const { data: prof } = await supabase
        .from('profiles')
        .select('rolle')
        .eq('id', u.user.id)
        .maybeSingle();
      if ((prof?.rolle as string | undefined) === 'admin') role = 'admin';
    }
  }
  if (!role) return { ok: false, error: 'Keine Berechtigung.' };

  const { error } = await supabase.from('anfrage_messages').insert({
    anfrage_id: anfrageId,
    from_user: u.user.id,
    from_role: role,
    message: trimmed,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath('/dashboard/verkaeufer/anfragen');
  revalidatePath('/dashboard/kaeufer/anfragen');
  return { ok: true };
}
