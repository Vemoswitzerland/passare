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
 * Anhang-Typ für Chat-Nachrichten — auf Verkäufer-Seite kommen aktuell
 * Datenraum-Dateien rein, später könnten weitere Quellen dazu kommen
 * (Käufer-Dossier, Direkt-Upload).
 */
export type AnfrageAttachment = {
  kind: 'datenraum' | 'kaeufer_dossier' | 'upload';
  file_id?: string;
  name: string;
  url?: string;
  size?: number;
  mime?: string;
};

/**
 * Verkäufer (oder Käufer) schickt eine Nachricht im Anfragen-Chat.
 *
 * Cyrill 30.04.2026: «Konversation soll als Thread unter Anfragen
 * laufen — Käufer und Verkäufer schreiben sich direkt, mit Inserat-
 * Tag im Chat-Header.» Cyrill 30.04.2026 (Update): «Chat soll mehr
 * Funktionen haben — Unterlagen senden, Käufer kann Dokumente schicken.»
 *
 * RLS regelt wer schreiben darf. Bei attachments mit kind=datenraum
 * prüfen wir zusätzlich dass die file zum richtigen Inserat gehört.
 */
export async function sendAnfrageMessage(
  anfrageId: string,
  message: string,
  attachments: AnfrageAttachment[] = [],
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return { ok: false, error: 'Nicht angemeldet.' };

  const trimmed = message.trim();
  // Eine leere Nachricht ist OK wenn Anhänge dabei sind ("Hier deine Unterlagen")
  if (trimmed.length === 0 && attachments.length === 0) {
    return { ok: false, error: 'Leere Nachricht.' };
  }
  if (trimmed.length > 4000) return { ok: false, error: 'Zu lang (max 4000 Zeichen).' };
  if (attachments.length > 20) return { ok: false, error: 'Zu viele Anhänge (max 20).' };

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

  // Datenraum-Anhänge validieren: nur eigene Files des Inserats
  if (attachments.some((a) => a.kind === 'datenraum')) {
    const fileIds = attachments
      .filter((a) => a.kind === 'datenraum' && a.file_id)
      .map((a) => a.file_id as string);
    if (fileIds.length > 0) {
      const { data: files } = await supabase
        .from('datenraum_files')
        .select('id, inserat_id')
        .in('id', fileIds);
      const allMatch = (files ?? []).every(
        (f) => f.inserat_id === anf.inserat_id,
      );
      if (!allMatch || (files?.length ?? 0) !== fileIds.length) {
        return { ok: false, error: 'Ungültige Datenraum-Datei.' };
      }
    }
  }

  const { error } = await supabase.from('anfrage_messages').insert({
    anfrage_id: anfrageId,
    from_user: u.user.id,
    from_role: role,
    message: trimmed.length > 0 ? trimmed : '(Unterlagen)',
    attachments: attachments as unknown as Record<string, unknown>[],
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath('/dashboard/verkaeufer/anfragen');
  revalidatePath('/dashboard/kaeufer/anfragen');
  return { ok: true };
}

/**
 * Listet die Datenraum-Dateien des Verkäufers für ein Inserat — als
 * Auswahl-Quelle für den «Unterlagen senden»-Knopf im Chat.
 *
 * RLS prüft Owner via Inserat-Verkäufer-ID.
 */
export async function listDatenraumFilesForAnfrage(
  anfrageId: string,
): Promise<{
  ok: true;
  files: Array<{ id: string; name: string; ordner: string | null; size: number; mime: string | null }>;
} | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return { ok: false, error: 'Nicht angemeldet.' };

  const { data: anf } = await supabase
    .from('anfragen')
    .select('inserat_id, inserate!inner(verkaeufer_id)')
    .eq('id', anfrageId)
    .maybeSingle();
  if (!anf) return { ok: false, error: 'Anfrage nicht gefunden.' };

  const verkaeuferId = (anf.inserate as unknown as { verkaeufer_id: string } | { verkaeufer_id: string }[]);
  const vId = Array.isArray(verkaeuferId)
    ? verkaeuferId[0]?.verkaeufer_id
    : verkaeuferId?.verkaeufer_id;
  if (vId !== u.user.id) return { ok: false, error: 'Keine Berechtigung.' };

  const { data: files, error } = await supabase
    .from('datenraum_files')
    .select('id, name, ordner, size_bytes, mime_type')
    .eq('inserat_id', anf.inserat_id as string)
    .order('ordner', { ascending: true })
    .order('name', { ascending: true });
  if (error) return { ok: false, error: error.message };

  return {
    ok: true,
    files: (files ?? []).map((f) => ({
      id: f.id as string,
      name: f.name as string,
      ordner: (f.ordner as string | null) ?? null,
      size: Number(f.size_bytes ?? 0),
      mime: (f.mime_type as string | null) ?? null,
    })),
  };
}
