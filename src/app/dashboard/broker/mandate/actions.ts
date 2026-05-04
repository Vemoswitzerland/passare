'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function createMandatAction(data: {
  firma_name: string;
  branche_id: string | null;
  kanton: string | null;
}): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: 'Nicht eingeloggt' };

  // Server-side Validation — Wizard validiert clientseitig, aber doppelt sicher.
  if (!data.firma_name?.trim() || data.firma_name.trim().length < 2) {
    return { error: 'Bitte gib einen Firmen-Namen ein (mindestens 2 Zeichen).' };
  }

  const { data: result, error } = await supabase.rpc('create_broker_mandat', {
    p_data: {
      firma_name: data.firma_name.trim(),
      branche_id: data.branche_id,
      kanton: data.kanton,
    },
  });

  if (error) {
    if (error.message.includes('mandate-limit')) {
      return { error: 'Du hast dein Mandate-Limit erreicht. Upgrade auf Pro für mehr Mandate.' };
    }
    if (error.message.includes('nicht aktiv')) {
      return { error: 'Dein Broker-Abo ist nicht aktiv. Aktiviere es zuerst.' };
    }
    if (error.message.includes('kein broker-profil')) {
      return { error: 'Dein Broker-Profil fehlt. Bitte schliesse das Onboarding ab.' };
    }
    return { error: error.message };
  }

  // Layout-Cache invalidieren — Sidebar zeigt sofort neue mandateActive-Counter
  revalidatePath('/dashboard/broker', 'layout');
  revalidatePath('/dashboard/broker/mandate');

  return { id: result as string };
}
