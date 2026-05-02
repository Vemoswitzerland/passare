import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 3 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  // Profilbild-Upload ist für ALLE eingeloggten Käufer offen — kein
  // Tier-Gate. (Gilt jetzt auch für Basic; Spec: "Profilbild auch für
  // Gratis-User".)

  // Pre-Check: Content-Length verhindert Memory-DoS via grosse Multipart-Bodies.
  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (contentLength > MAX_SIZE + 65536) {
    return NextResponse.json({ error: 'Datei zu gross (max 3 MB).' }, { status: 413 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) return NextResponse.json({ error: 'file missing' }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Nur JPG, PNG oder WebP erlaubt.' }, { status: 415 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Datei zu gross (max 3 MB).' }, { status: 413 });
  }

  // Magic-Bytes-Check — verhindert MIME-Spoofing.
  const arrayBuf = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuf.slice(0, 12));
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng =
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const isWebp =
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  if (!isJpeg && !isPng && !isWebp) {
    return NextResponse.json({ error: 'Datei sieht nicht wie JPG/PNG/WebP aus.' }, { status: 415 });
  }

  // Altes Logo aus Storage entfernen (sonst Speichermüll).
  const { data: oldProfile } = await supabase
    .from('kaeufer_profil')
    .select('logo_url')
    .eq('user_id', userData.user.id)
    .maybeSingle();
  if (oldProfile?.logo_url) {
    try {
      const oldPath = new URL(oldProfile.logo_url).pathname.split('/kaeufer-logos/').pop();
      if (oldPath) await supabase.storage.from('kaeufer-logos').remove([decodeURIComponent(oldPath)]);
    } catch {
      // best-effort: alter Pfad nicht parsbar — egal
    }
  }

  const ext = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
  const path = `${userData.user.id}/logo-${Date.now()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from('kaeufer-logos')
    .upload(path, arrayBuf, {
      contentType: file.type,
      upsert: true,
    });

  if (upErr) {
    console.error('[upload-logo] storage error:', upErr.message);
    return NextResponse.json({ error: 'Upload fehlgeschlagen.' }, { status: 500 });
  }

  const { data: pub } = supabase.storage.from('kaeufer-logos').getPublicUrl(path);

  const { error: dbErr } = await supabase
    .from('kaeufer_profil')
    .update({ logo_url: pub.publicUrl })
    .eq('user_id', userData.user.id);

  if (dbErr) {
    console.error('[upload-logo] db error:', dbErr.message);
    return NextResponse.json({ error: 'Logo gespeichert, Profil-Update fehlgeschlagen.' }, { status: 500 });
  }

  return NextResponse.json({ url: pub.publicUrl, path });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const { data: kp } = await supabase
    .from('kaeufer_profil')
    .select('logo_url')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  if (kp?.logo_url) {
    const url = new URL(kp.logo_url);
    const storagePath = url.pathname.split('/kaeufer-logos/').pop();
    if (storagePath) {
      await supabase.storage.from('kaeufer-logos').remove([decodeURIComponent(storagePath)]);
    }
  }

  await supabase
    .from('kaeufer_profil')
    .update({ logo_url: null })
    .eq('user_id', userData.user.id);

  return NextResponse.json({ ok: true });
}
