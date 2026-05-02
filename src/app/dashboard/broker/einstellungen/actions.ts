'use server';

import { createClient } from '@/lib/supabase/server';

export async function updateBrokerProfileAction(data: {
  agentur_name: string;
  slug: string;
  bio: string;
  website: string;
  telefon: string;
}) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: 'Nicht eingeloggt' };

  const { error } = await supabase.rpc('create_broker_profile', {
    p_agentur_name: data.agentur_name,
    p_slug: data.slug,
    p_bio: data.bio || null,
    p_website: data.website || null,
    p_telefon: data.telefon || null,
    p_logo_url: null,
    p_handelsregister_uid: null,
  });

  if (error) return { error: error.message };
  return { success: true };
}
