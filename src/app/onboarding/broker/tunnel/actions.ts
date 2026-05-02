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
  paket: 'starter' | 'pro';
  interval: 'monthly' | 'yearly';
}): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: 'Nicht eingeloggt' };

  const h = await headers();
  const ip = (h.get('x-forwarded-for') ?? '').split(',')[0]?.trim() || null;
  const ua = h.get('user-agent') ?? null;

  // Slug-Validierung früh (vor jedem DB-Write)
  if (!data.slug || data.slug.length < 3) {
    return { error: 'Bitte wähle eine gültige Profil-URL (mind. 3 Zeichen).' };
  }

  // 1. Slug-Konflikt zuerst checken — verhindert das halb-fertige Profil-Problem
  const { data: existingSlug } = await supabase
    .from('broker_profiles')
    .select('id')
    .eq('slug', data.slug)
    .neq('id', userData.user.id)
    .maybeSingle();
  if (existingSlug) {
    return { error: 'Diese Profil-URL ist bereits vergeben. Bitte wähle eine andere.' };
  }

  // 2. Complete onboarding (sets rolle = 'broker')
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

  // 3. Create broker profile
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

  // 4. Pre-set tier so the dashboard already shows the right limits
  // before the Stripe webhook arrives (cosmetic — webhook is authoritative).
  await supabase
    .from('broker_profiles')
    .update({
      tier: data.paket,
      mandate_limit: data.paket === 'pro' ? 25 : 5,
      team_seats_limit: data.paket === 'pro' ? 5 : 0,
      subscription_interval: data.interval,
    })
    .eq('id', userData.user.id);

  return { success: true };
}
