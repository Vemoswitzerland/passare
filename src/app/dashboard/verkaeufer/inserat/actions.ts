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
    .eq('verkaeufer_id', userData.user.id)
    .eq('status', 'entwurf')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing && existing.zefix_uid && existing.zefix_uid === draft.zefix_uid) {
    // Cookie löschen versuchen (nur wenn wir in Server-Action-Kontext sind —
    // sonst silently ignore, das Cookie expired in 30 Min eh)
    try { cookieStore.set('pre_reg_draft', '', { maxAge: 0, path: '/' }); } catch { /* render-mode */ }
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

  // Cookie löschen nach erfolgreichem Übertrag — silently fail wenn
  // wir aus einer Server-Component aufgerufen werden (Next 16
  // verbietet Cookie-Set ausserhalb Server-Action / Route-Handler).
  // Das Cookie hat 30 Min TTL und expired sowieso.
  try { cookieStore.set('pre_reg_draft', '', { maxAge: 0, path: '/' }); } catch { /* render-mode */ }

  if (error) {
    console.error('[pre-reg-takeover]', error);
    return null;
  }
  return data as string;
}

/**
 * Verkäufer aktualisiert Inserat-Felder.
 *
 * Wenn das Inserat live ist und nur irrelevante Felder geändert werden
 * (Cover, Social-URLs, Chat-Settings), bleibt es live — kein Re-Review.
 * Bei relevanten Änderungen (Titel, Preis, Beschreibung, …) geht es
 * automatisch zurück in `pending` und wandert ins Admin-Audit.
 *
 * Wirkt nur bei Status `live`. Inserate die noch in Prüfung sind oder
 * abgelehnt wurden, werden über andere Wege gehandhabt.
 */
export async function updateInseratFields(
  inseratId: string,
  changes: Record<string, unknown>,
): Promise<ActionResult & { needsReview?: boolean; changedFields?: string[] }> {
  const { classifyChanges, FIELD_LABEL } = await import('@/lib/admin/inserat-change-classification');
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false, error: 'Nicht angemeldet.' };

  // Aktuellen Stand laden
  const { data: before } = await supabase
    .from('inserate')
    .select('*')
    .eq('id', inseratId)
    .maybeSingle();
  if (!before) return { ok: false, error: 'Inserat nicht gefunden.' };
  if (before.verkaeufer_id !== userData.user.id) {
    return { ok: false, error: 'Keine Berechtigung.' };
  }

  // Klassifizieren
  const classification = classifyChanges(
    before as Record<string, unknown>,
    { ...before, ...changes } as Record<string, unknown>,
  );

  // Status-Logik:
  //  - aktuell live + nur irrelevante Änderungen → bleibt live
  //  - aktuell live + relevante Änderungen → zurück auf pending + audit-message
  //  - alle anderen (entwurf/pending/rueckfrage) → behält den Status, kein Audit
  const wasLive = before.status === 'live';
  const goBackToReview = wasLive && classification.needsReview;

  const updatePayload: Record<string, unknown> = { ...changes };
  if (goBackToReview) {
    updatePayload.status = 'pending';
  }

  const { error } = await supabase
    .from('inserate')
    .update(updatePayload)
    .eq('id', inseratId);
  if (error) return { ok: false, error: error.message };

  // Wenn Re-Review ausgelöst: Audit-Message schreiben
  if (goBackToReview) {
    const changedLabels = classification.relevantChanges
      .map((f) => FIELD_LABEL[f] ?? f)
      .join(', ');
    await supabase.from('inserat_audit_messages').insert({
      inserat_id: inseratId,
      from_user: userData.user.id,
      from_role: 'verkaeufer',
      kind: 'antwort',
      message: `Inserat geändert — relevante Felder: ${changedLabels}. Bitte erneut prüfen.`,
    });
  }

  revalidatePath('/dashboard/verkaeufer/inserat');
  revalidatePath(`/dashboard/verkaeufer/inserat/${inseratId}/edit`);
  if (goBackToReview) {
    revalidatePath('/admin/inserate');
    revalidatePath(`/admin/inserate/${inseratId}`);
  }
  revalidatePath('/');

  return {
    ok: true,
    id: inseratId,
    needsReview: goBackToReview,
    changedFields: [...classification.relevantChanges, ...classification.unknownChanges],
  };
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

/**
 * Verkäufer antwortet auf Admin-Rückfrage:
 * - Schreibt Antwort in inserat_audit_messages (kind='antwort')
 * - Setzt Inserat-Status zurück auf 'pending' (geht erneut ins Audit)
 * - RLS sichert dass nur eigener Verkäufer schreiben kann
 */
export async function respondToRevisionAction(
  inseratId: string,
  message: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false, error: 'Nicht angemeldet.' };

  const trimmed = message.trim();
  if (trimmed.length < 3) return { ok: false, error: 'Antwort zu kurz.' };
  if (trimmed.length > 4000) return { ok: false, error: 'Antwort zu lang (max. 4000 Zeichen).' };

  // Owner-Check + Status-Check
  const { data: inserat } = await supabase
    .from('inserate')
    .select('id, verkaeufer_id, status')
    .eq('id', inseratId)
    .maybeSingle();

  if (!inserat) return { ok: false, error: 'Inserat nicht gefunden.' };
  if (inserat.verkaeufer_id !== userData.user.id) {
    return { ok: false, error: 'Keine Berechtigung.' };
  }
  if (inserat.status !== 'rueckfrage') {
    return { ok: false, error: 'Nur bei offenen Rückfragen möglich.' };
  }

  // Antwort posten (RLS lässt nur eigene durch)
  const { error: msgErr } = await supabase.from('inserat_audit_messages').insert({
    inserat_id: inseratId,
    from_user: userData.user.id,
    from_role: 'verkaeufer',
    kind: 'antwort',
    message: trimmed,
  });
  if (msgErr) return { ok: false, error: msgErr.message };

  // Status zurück auf pending (geht erneut ins Admin-Audit)
  const { error: statusErr } = await supabase
    .from('inserate')
    .update({ status: 'pending' })
    .eq('id', inseratId);
  if (statusErr) return { ok: false, error: statusErr.message };

  revalidatePath('/dashboard/verkaeufer/inserat');
  revalidatePath(`/dashboard/verkaeufer/inserat/${inseratId}/edit`);
  revalidatePath(`/admin/inserate/${inseratId}`);
  revalidatePath('/admin/inserate');
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
