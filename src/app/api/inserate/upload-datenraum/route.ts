/**
 * POST /api/inserate/upload-datenraum
 * Upload Datenraum-File (PDF, XLSX, etc.) → datenraum-files Bucket.
 * Versionierung: wenn File mit gleichem Namen existiert → version++.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_MIMES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'application/vnd.ms-excel', // xls
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/msword', // doc
  'image/png',
  'image/jpeg',
];
const MAX_SIZE = 25 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const inseratId = formData.get('inserat_id') as string | null;
  const ordner = (formData.get('ordner') as string | null) ?? 'sonstiges';

  if (!file) return NextResponse.json({ error: 'file missing' }, { status: 400 });
  if (!inseratId) return NextResponse.json({ error: 'inserat_id missing' }, { status: 400 });
  if (!ALLOWED_MIMES.includes(file.type)) {
    return NextResponse.json({ error: 'mime not allowed' }, { status: 415 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'too large' }, { status: 413 });
  }

  const { data: inserat } = await supabase
    .from('inserate')
    .select('verkaeufer_id')
    .eq('id', inseratId)
    .maybeSingle();
  if (!inserat || inserat.verkaeufer_id !== userData.user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  // Version: ist ein File mit gleichem Namen schon da?
  const { data: existing } = await supabase
    .from('datenraum_files')
    .select('id, version')
    .eq('inserat_id', inseratId)
    .eq('name', file.name)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();
  const version = existing ? existing.version + 1 : 1;

  const path = `${inseratId}/${ordner}/${Date.now()}-v${version}-${encodeURIComponent(file.name)}`;
  const buf = await file.arrayBuffer();

  const { error: upErr } = await supabase.storage
    .from('datenraum-files')
    .upload(path, buf, {
      contentType: file.type,
      upsert: false,
    });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { data: row, error: dbErr } = await supabase
    .from('datenraum_files')
    .insert({
      inserat_id: inseratId,
      parent_file_id: existing?.id ?? null,
      ordner,
      storage_path: path,
      name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      version,
      uploaded_by: userData.user.id,
    })
    .select()
    .single();

  if (dbErr) {
    await supabase.storage.from('datenraum-files').remove([path]);
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  return NextResponse.json({ file: row });
}
