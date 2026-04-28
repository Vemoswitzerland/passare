'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Liefert den aktuellen Supabase-Auth-Status.
 *
 * Wird vom Merken-Button verwendet, um zwischen «Like speichern» (eingeloggt)
 * und «Login-Dialog öffnen» (nicht eingeloggt) zu unterscheiden.
 */
export function useAuthUser() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      setUserId(data.user?.id ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { isLoggedIn: !!userId, userId, loading };
}
