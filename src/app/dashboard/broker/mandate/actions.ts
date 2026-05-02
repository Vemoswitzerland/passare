'use server';

import { createClient } from '@/lib/supabase/server';

export async function createMandatAction(data: {
  firma_name: string;
  branche_id: string | null;
  kanton: string | null;
}): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: 'Nicht eingeloggt' };

  const { data: result, error } = await supabase.rpc('create_broker_mandat', {
    p_data: {
      firma_name: data.firma_name,
      branche_id: data.branche_id,
      kanton: data.kanton,
    },
  });

  if (error) {
    if (error.message.includes('mandate-limit')) {
      return { error: 'Du hast dein Mandate-Limit erreicht. Upgrade auf Pro für mehr Mandate.' };
    }
    if (error.message.includes('nicht aktiv')) {
      return { error: 'Dein Broker-Abo ist nicht aktiv.' };
    }
    return { error: error.message };
  }

  return { id: result as string };
}
