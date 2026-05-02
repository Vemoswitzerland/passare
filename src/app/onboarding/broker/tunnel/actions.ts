'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export async function completeBrokerOnboarding(data: {
  full_name: string;
  agentur_name: string;
  slug: string;
  bio: string;
  website: string;
  telefon: string;
  kanton: string;
}): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: 'Nicht eingeloggt' };

  const h = await headers();
  const ip = (h.get('x-forwarded-for') ?? '').split(',')[0]?.trim() || null;
  const ua = h.get('user-agent') ?? null;

  // 1. Complete onboarding (sets rolle = 'broker')
  const { error: onboardingErr } = await supabase.rpc('complete_onboarding', {
    p_rolle: 'broker',
    p_full_name: data.full_name,
    p_kanton: data.kanton,
    p_sprache: 'de',
    p_agb_version: '2026-05',
    p_datenschutz_version: '2026-05',
    p_ip: ip,
    p_user_agent: ua,
  });

  if (onboardingErr) {
    return { error: `Onboarding fehlgeschlagen: ${onboardingErr.message}` };
  }

  // 2. Create broker profile
  const { error: profileErr } = await supabase.rpc('create_broker_profile', {
    p_agentur_name: data.agentur_name,
    p_slug: data.slug,
    p_bio: data.bio || null,
    p_website: data.website || null,
    p_telefon: data.telefon || null,
    p_logo_url: null,
    p_handelsregister_uid: null,
  });

  if (profileErr) {
    if (profileErr.message.includes('slug')) {
      return { error: 'Diese Profil-URL ist bereits vergeben. Bitte wähle eine andere.' };
    }
    return { error: `Broker-Profil konnte nicht erstellt werden: ${profileErr.message}` };
  }

  return { success: true };
}
