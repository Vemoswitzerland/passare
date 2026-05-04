'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

/**
 * Bucket für öffentliche Broker-Logos (Verzeichnis + /broker/[slug]).
 * Existiert seit Migration 20260502 und ist public-readable.
 */
const BROKER_LOGOS_BUCKET = 'broker-logos';

const ALLOWED_LOGO_MIME = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2 MB

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

/**
 * Lädt ein Broker-Logo in den `broker-logos`-Bucket hoch und speichert die
 * Public-URL in `broker_profiles.logo_url`. Dieses Logo erscheint im
 * Verzeichnis (`/broker/verzeichnis`) und auf dem Public-Profil
 * (`/broker/[slug]`) — getrennt vom Käufer-Profil-Logo (das landet im
 * `kaeufer-logos`-Bucket via `LogoUpload`-Komponente).
 *
 * Sicherheits-Notes:
 *  - Pfad ist `<user_id>/<filename>` — RLS-Policy aus 20260502 erlaubt nur
 *    Owner-Writes auf den eigenen Folder.
 *  - MIME-Whitelist + 2 MB Cap.
 */
export async function updateBrokerLogoAction(formData: FormData): Promise<{
  error?: string;
  success?: boolean;
  url?: string;
}> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: 'Nicht eingeloggt' };

  const file = formData.get('logo') as File | null;
  if (!file || file.size === 0) {
    return { error: 'Bitte wähle eine Bilddatei aus.' };
  }
  if (file.size > MAX_LOGO_BYTES) {
    return { error: 'Bilddatei ist zu gross (max. 2 MB).' };
  }
  if (!ALLOWED_LOGO_MIME.includes(file.type)) {
    return { error: 'Nur PNG, JPG, WebP oder SVG erlaubt.' };
  }

  const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : 'png';
  // Wir packen den Timestamp dran damit Browser den alten Cache-Eintrag
  // umgeht — sonst sieht der Broker "noch das alte Logo" trotz Upload.
  const path = `${userData.user.id}/logo-${Date.now()}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from(BROKER_LOGOS_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (uploadErr) {
    return { error: `Upload fehlgeschlagen: ${uploadErr.message}` };
  }

  const { data: pub } = supabase.storage.from(BROKER_LOGOS_BUCKET).getPublicUrl(path);
  const publicUrl = pub.publicUrl;

  const { error: updErr } = await supabase
    .from('broker_profiles')
    .update({ logo_url: publicUrl })
    .eq('id', userData.user.id);

  if (updErr) {
    return { error: `Datenbank-Update fehlgeschlagen: ${updErr.message}` };
  }

  revalidatePath('/dashboard/broker', 'layout');
  revalidatePath('/dashboard/broker/einstellungen');
  return { success: true, url: publicUrl };
}
