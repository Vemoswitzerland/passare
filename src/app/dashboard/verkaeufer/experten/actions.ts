'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

/**
 * Verkäufer bucht einen Beratungs-Termin bei einem Experten.
 *
 * Cyrill 01.05.2026: «Wenn der Admin User einstellt, sieht der Verkäufer
 * sie als Experten — direkt buchen, Termin anwählen, geht zum Checkout.»
 *
 * Workflow:
 *   1. Slot-Verfügbarkeit prüfen (Wochentag, Uhrzeit, keine Kollision)
 *   2. Termin in DB anlegen mit status='pending' + Honorar-Snapshot
 *   3. Mock-Stripe-Session erzeugen (oder echtes Stripe wenn integriert)
 *   4. Redirect auf Checkout-Page (im MVP: direkt status='paid' + Bestätigung)
 */
export async function bookExpertTermin(input: {
  experteId: string;
  startAt: string; // ISO datetime
  dauerMin: number;
  name: string;
  email: string;
  telefon?: string;
  thema?: string;
  notizen?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return { ok: false, error: 'Nicht angemeldet.' };

  // Experte laden + Honorar-Snapshot berechnen
  const { data: experte } = await supabase
    .from('experten')
    .select('id, name, honorar_chf_pro_stunde, slot_dauer_min, is_active')
    .eq('id', input.experteId)
    .maybeSingle();
  if (!experte || !experte.is_active) {
    return { ok: false, error: 'Experte nicht verfügbar.' };
  }

  const dauer = Math.max(15, Math.min(180, input.dauerMin || (experte.slot_dauer_min as number)));
  const honorar = (Number(experte.honorar_chf_pro_stunde) * dauer) / 60;

  // Kollision prüfen — Doppelbuchungen verhindern
  const startIso = new Date(input.startAt).toISOString();
  const endIso = new Date(new Date(input.startAt).getTime() + dauer * 60_000).toISOString();
  const { data: kollisionen } = await supabase
    .from('experten_termine')
    .select('id, start_at, dauer_min')
    .eq('experte_id', input.experteId)
    .in('status', ['pending', 'paid', 'confirmed'])
    .gte('start_at', new Date(new Date(startIso).getTime() - 4 * 60 * 60_000).toISOString())
    .lte('start_at', endIso);
  if (kollisionen && kollisionen.length > 0) {
    // Pruefen ob wirklich überlappung
    const overlap = kollisionen.some((k) => {
      const kStart = new Date(k.start_at as string).getTime();
      const kEnd = kStart + (k.dauer_min as number) * 60_000;
      const newStart = new Date(startIso).getTime();
      const newEnd = newStart + dauer * 60_000;
      return newStart < kEnd && newEnd > kStart;
    });
    if (overlap) {
      return { ok: false, error: 'Dieser Slot ist bereits gebucht. Bitte wähle einen anderen.' };
    }
  }

  // Termin anlegen
  const { data: created, error } = await supabase
    .from('experten_termine')
    .insert({
      experte_id: input.experteId,
      verkaeufer_id: u.user.id,
      start_at: startIso,
      dauer_min: dauer,
      name: input.name,
      email: input.email,
      telefon: input.telefon ?? null,
      thema: input.thema ?? null,
      notizen: input.notizen ?? null,
      honorar_chf: honorar,
      status: 'pending',
      stripe_session_id: `mock_${Date.now()}`,
    })
    .select('id')
    .single();
  if (error) return { ok: false, error: error.message };

  revalidatePath('/dashboard/verkaeufer/experten');
  return { ok: true, id: (created?.id as string) ?? undefined };
}

/**
 * Mock-Checkout: setzt status auf paid + confirmed.
 * In Produktion: Webhook von Stripe nach erfolgreichem Payment.
 */
export async function confirmExpertTerminMock(terminId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return { ok: false, error: 'Nicht angemeldet.' };

  const { error } = await supabase
    .from('experten_termine')
    .update({ status: 'confirmed' })
    .eq('id', terminId)
    .eq('verkaeufer_id', u.user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/dashboard/verkaeufer/experten');
  return { ok: true, id: terminId };
}

/**
 * Verkäufer storniert einen eigenen Termin.
 */
export async function cancelExpertTermin(terminId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return { ok: false, error: 'Nicht angemeldet.' };

  const { error } = await supabase
    .from('experten_termine')
    .update({ status: 'cancelled' })
    .eq('id', terminId)
    .eq('verkaeufer_id', u.user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/dashboard/verkaeufer/experten');
  return { ok: true };
}
