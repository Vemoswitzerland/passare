'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function updateBrokerProfileAction(data: {
  agentur_name: string;
  slug: string;
  bio: string;
  website: string;
  telefon: string;
}): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: 'Nicht eingeloggt' };

  // Vor-Validierung
  if (!data.agentur_name?.trim() || data.agentur_name.trim().length < 2) {
    return { error: 'Agentur-Name muss mindestens 2 Zeichen haben.' };
  }
  if (!data.slug?.trim() || data.slug.trim().length < 3) {
    return { error: 'Profil-URL muss mindestens 3 Zeichen haben.' };
  }
  if (!/^[a-z0-9-]+$/.test(data.slug)) {
    return { error: 'Profil-URL darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten.' };
  }

  // Slug-Konflikt-Pre-Check (außer eigener)
  const { data: existing } = await supabase
    .from('broker_profiles')
    .select('id')
    .eq('slug', data.slug)
    .neq('id', userData.user.id)
    .maybeSingle();
  if (existing) {
    return { error: 'Diese Profil-URL ist bereits vergeben. Bitte wähle eine andere.' };
  }

  const { error } = await supabase.rpc('create_broker_profile', {
    p_agentur_name: data.agentur_name,
    p_slug: data.slug,
    p_bio: data.bio || null,
    p_website: data.website || null,
    p_telefon: data.telefon || null,
    p_logo_url: null,
    p_handelsregister_uid: null,
  });

  if (error) {
    if (error.message.includes('slug') || error.message.toLowerCase().includes('unique')) {
      return { error: 'Diese Profil-URL ist bereits vergeben.' };
    }
    return { error: error.message };
  }

  // Layout neu laden — Slug erscheint in Sidebar/Topbar
  revalidatePath('/dashboard/broker', 'layout');
  return { success: true };
}
