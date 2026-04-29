// ════════════════════════════════════════════════════════════════════
// Inserat-Galerie API
// ────────────────────────────────────────────────────────────────────
// GET    /api/inserate/galerie?inserat=<id>     → Liste der Bilder
// POST   /api/inserate/galerie                  → Bild hochladen (multipart)
// PATCH  /api/inserate/galerie                  → Sortierung updaten
// DELETE /api/inserate/galerie?id=<medium-id>   → Bild löschen
// ════════════════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;
const MAX_BILDER = 8;
const BUCKET = 'inserate-cover';

async function ensureOwner(supabase: any, userId: string, inseratId: string) {
  const { data } = await supabase
    .from('inserate')
    .select('verkaeufer_id')
    .eq('id', inseratId)
    .maybeSingle();
  return Boolean(data && data.verkaeufer_id === userId);
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const inseratId = req.nextUrl.searchParams.get('inserat');
  if (!inseratId) return NextResponse.json({ error: 'inserat missing' }, { status: 400 });

  if (!(await ensureOwner(supabase, u.user.id, inseratId))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('inserat_medien')
    .select('id, url, titel, sortierung, ist_cover, mime_type, created_at')
    .eq('inserat_id', inseratId)
    .eq('typ', 'bild')
    .order('sortierung', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const fd = await req.formData();
  const file = fd.get('file') as File | null;
  const inseratId = fd.get('inserat_id') as string | null;

  if (!file) return NextResponse.json({ error: 'file missing' }, { status: 400 });
  if (!inseratId) return NextResponse.json({ error: 'inserat_id missing' }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'mime not allowed' }, { status: 415 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'too large (max 5 MB)' }, { status: 413 });

  if (!(await ensureOwner(supabase, u.user.id, inseratId))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  // Limit-Check
  const { count } = await supabase
    .from('inserat_medien')
    .select('id', { count: 'exact', head: true })
    .eq('inserat_id', inseratId)
    .eq('typ', 'bild');
  if ((count ?? 0) >= MAX_BILDER) {
    return NextResponse.json({ error: `Max ${MAX_BILDER} Bilder pro Inserat` }, { status: 400 });
  }

  const ext = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
  const path = `${u.user.id}/${inseratId}-galerie-${Date.now()}.${ext}`;
  const arrayBuf = await file.arrayBuffer();

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, Buffer.from(arrayBuf), { contentType: file.type, upsert: false });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);

  // Maximale Sortierung ermitteln
  const { data: maxRow } = await supabase
    .from('inserat_medien')
    .select('sortierung')
    .eq('inserat_id', inseratId)
    .eq('typ', 'bild')
    .order('sortierung', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextSort = (maxRow?.sortierung ?? -1) + 1;

  const { data: row, error: insErr } = await supabase
    .from('inserat_medien')
    .insert({
      inserat_id: inseratId,
      typ: 'bild',
      url: pub.publicUrl,
      mime_type: file.type,
      size_bytes: file.size,
      sortierung: nextSort,
    })
    .select('id, url, sortierung')
    .single();

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
  return NextResponse.json({ ok: true, item: row });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const body = await req.json();
  const inseratId: string = body.inserat_id;
  const order: string[] = body.order; // Array von medium-IDs in neuer Reihenfolge
  if (!inseratId || !Array.isArray(order)) {
    return NextResponse.json({ error: 'inserat_id + order required' }, { status: 400 });
  }

  if (!(await ensureOwner(supabase, u.user.id, inseratId))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  // Update Sortierung pro Medium
  for (let i = 0; i < order.length; i++) {
    await supabase
      .from('inserat_medien')
      .update({ sortierung: i })
      .eq('id', order[i])
      .eq('inserat_id', inseratId);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id missing' }, { status: 400 });

  // Owner-Check via JOIN auf inserate
  const { data: medium } = await supabase
    .from('inserat_medien')
    .select('id, inserat_id, url')
    .eq('id', id)
    .maybeSingle();
  if (!medium) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (!(await ensureOwner(supabase, u.user.id, medium.inserat_id))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  await supabase.from('inserat_medien').delete().eq('id', id);

  // Storage-File löschen (best-effort)
  if (medium.url) {
    const m = medium.url.match(/inserate-cover\/(.+)$/);
    if (m) await supabase.storage.from(BUCKET).remove([m[1]]);
  }

  return NextResponse.json({ ok: true });
}
