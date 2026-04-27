/**
 * POST /api/inserate/upload-cover
 *
 * Upload Cover-Bild → Storage-Bucket inserate-cover.
 * Pfad-Konvention: {user_id}/{inserat_id}.{ext}
 * RLS-Policy in Migration: nur Owner darf in seinen Pfad uploaden.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const inseratId = formData.get('inserat_id') as string | null;

  if (!file) return NextResponse.json({ error: 'file missing' }, { status: 400 });
  if (!inseratId) return NextResponse.json({ error: 'inserat_id missing' }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'mime not allowed' }, { status: 415 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'too large' }, { status: 413 });
  }

  // Verify ownership
  const { data: inserat } = await supabase
    .from('inserate')
    .select('owner_id')
    .eq('id', inseratId)
    .maybeSingle();
  if (!inserat || inserat.owner_id !== userData.user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const ext = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
  const path = `${userData.user.id}/${inseratId}-${Date.now()}.${ext}`;
  const arrayBuf = await file.arrayBuffer();

  const { error: upErr } = await supabase.storage
    .from('inserate-cover')
    .upload(path, arrayBuf, {
      contentType: file.type,
      upsert: true,
    });

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  const { data: pub } = supabase.storage.from('inserate-cover').getPublicUrl(path);
  return NextResponse.json({ url: pub.publicUrl, path });
}
