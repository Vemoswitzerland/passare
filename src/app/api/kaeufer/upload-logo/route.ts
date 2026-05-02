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

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (profile?.subscription_tier !== 'plus' && profile?.subscription_tier !== 'max') {
    return NextResponse.json({ error: 'Logo-Upload ist ein Käufer+-Feature.' }, { status: 403 });
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

  const ext = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
  const path = `${userData.user.id}/logo-${Date.now()}.${ext}`;
  const arrayBuf = await file.arrayBuffer();

  const { error: upErr } = await supabase.storage
    .from('kaeufer-logos')
    .upload(path, arrayBuf, {
      contentType: file.type,
      upsert: true,
    });

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  const { data: pub } = supabase.storage.from('kaeufer-logos').getPublicUrl(path);

  await supabase
    .from('kaeufer_profil')
    .update({ logo_url: pub.publicUrl })
    .eq('user_id', userData.user.id);

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
