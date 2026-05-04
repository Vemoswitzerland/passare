'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Wenn ein User auf der 3-Optionen-Wahl-Page (/onboarding) eine Rolle
 * klickt, wird er in den jeweiligen Pre-Funnel geschickt — die Rolle
 * setzt erst der Funnel selbst sauber (Käufer-Tunnel via
 * ensureKaeuferRolle, Broker-Tunnel via complete_onboarding-RPC,
 * Verkäufer-Pre-Reg legt die Rolle und das Inserat zusammen an).
 *
 * WICHTIG (Cyrill 02.05.): KEIN direktes complete_onboarding hier —
 * das hat zur Folge dass ein "Ich verkaufe"-Klick einen Verkäufer
 * OHNE Inserat und OHNE Paket im Dashboard landen liess.
 */
export async function setRolleAction(rolle: 'verkaeufer' | 'kaeufer' | 'broker') {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) redirect('/auth/login');

  // ─────────────────────────────────────────────────────────────────
  // Bug-Fix Cyrill 04.05.: «Verkäufer-Pre-Reg-Abbrecher-Loop»
  //
  // Problem: User klickt «Ich verkaufe» → /verkaufen/start, bricht
  // ab und kommt zurück → /onboarding zeigt wieder den Rollen-Wähler,
  // weil `intended_role` nirgends persistiert war.
  //
  // Fix: Wir schreiben `intended_role` in die `user_metadata`, BEVOR
  // wir redirecten. `onboarding/page.tsx` liest das beim nächsten
  // Render aus und überspringt den Wähler.
  //
  // Best-effort — wenn `updateUser` fehlschlägt, redirecten wir
  // trotzdem (Cookie/RLS-Edge-Cases sollen den UX-Flow nicht blockieren).
  // ─────────────────────────────────────────────────────────────────
  try {
    if (u.user.user_metadata?.intended_role !== rolle) {
      await supabase.auth.updateUser({
        data: { ...u.user.user_metadata, intended_role: rolle },
      });
    }
  } catch (err) {
    console.warn('[setRolleAction] updateUser intended_role failed:', err);
  }

  if (rolle === 'broker') redirect('/onboarding/broker/tunnel');
  if (rolle === 'kaeufer') redirect('/onboarding/kaeufer/tunnel');
  // Verkäufer: zum Pre-Reg-Funnel (Firma → Bewertung → Account → Inserat).
  redirect('/verkaufen/start');
}
