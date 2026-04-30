'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Server-Action für Notification-Toggle.
 * Upsert in notification_prefs(user_id, key, enabled).
 * RLS sorgt dafür dass nur die eigenen Prefs verändert werden.
 */
export async function setNotificationPref(
  key: string,
  enabled: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return { ok: false, error: 'Nicht eingeloggt' };

  const { error } = await supabase
    .from('notification_prefs')
    .upsert(
      { user_id: u.user.id, key, enabled, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,key' },
    );

  if (error) {
    console.warn('[notif-prefs] upsert failed:', error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * Lädt alle Notification-Prefs des aktuellen Users als Map<key,boolean>.
 * Default-Wert (für nicht-persistierte Keys) ist immer `true` —
 * also wird im Frontend `prefs[key] ?? true` verwendet.
 */
export async function getNotificationPrefs(): Promise<Record<string, boolean>> {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return {};

  const { data } = await supabase
    .from('notification_prefs')
    .select('key, enabled')
    .eq('user_id', u.user.id);

  const map: Record<string, boolean> = {};
  for (const row of data ?? []) {
    map[row.key as string] = row.enabled as boolean;
  }
  return map;
}
