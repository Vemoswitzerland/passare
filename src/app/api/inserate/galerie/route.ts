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
import { validateFileSignature } from '@/lib/file-validation';

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

  // Magic-Bytes-Check: verhindert Spoofing (z.B. exe als image/png).
  if (!validateFileSignature(arrayBuf, file.type)) {
    return NextResponse.json({ error: 'Datei sieht nicht wie ein gültiges Bild aus.' }, { status: 415 });
  }

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, Buffer.from(arrayBuf), { contentType: file.type, upsert: false });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);

  // Sortierung: pragmatischer Fix für die Race-Condition. Wir nutzen
  // einen Timestamp-basierten Wert (now-ms seit Epoch) — bei parallelen
  // Uploads gibt es Mini-Drift, aber keine Kollision.
  // Long-term: trigger oder generated column.
  const nextSort = Date.now();

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

  if (insErr) {
    // Rollback: Storage-File entfernen, sonst sammelt sich Müll im Bucket
    // (Pattern wie in upload-datenraum/route.ts).
    await supabase.storage.from(BUCKET).remove([path]);
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }
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

  // DoS-Schutz: max. 30 Items pro Patch (Galerie-Limit ist ohnehin 8)
  if (order.length > 30) {
    return NextResponse.json({ error: 'too_many' }, { status: 400 });
  }

  if (!(await ensureOwner(supabase, u.user.id, inseratId))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  // Update Sortierung pro Medium — `.eq('inserat_id', inseratId)` als
  // zusätzlicher Filter, damit Owner nicht versehentlich (oder bösartig)
  // medium-IDs fremder Inserate umsortieren kann.
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
    .select('id, inserat_id, url, ist_cover')
    .eq('id', id)
    .maybeSingle();
  if (!medium) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (!(await ensureOwner(supabase, u.user.id, medium.inserat_id))) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  // Wenn das gelöschte Bild als Cover markiert ist, MUSS auch
  // inserate.cover_url genullt werden — sonst zeigt das Inserat einen
  // toten Storage-Pfad (404 für Käufer).
  if (medium.ist_cover) {
    await supabase
      .from('inserate')
      .update({ cover_url: null })
      .eq('id', medium.inserat_id);
  }

  await supabase.from('inserat_medien').delete().eq('id', id);

  // Storage-File löschen (best-effort) — robuste Pfad-Extraktion via URL-Parser,
  // damit Query-Strings (?token=…) nicht den Pfad korrumpieren.
  if (medium.url) {
    try {
      const pathname = new URL(medium.url).pathname;
      const marker = '/storage/v1/object/public/inserate-cover/';
      const idx = pathname.indexOf(marker);
      if (idx !== -1) {
        const filePath = decodeURIComponent(pathname.slice(idx + marker.length));
        if (filePath) await supabase.storage.from(BUCKET).remove([filePath]);
      }
    } catch {
      // URL nicht parsbar — best-effort, ignorieren.
    }
  }

  return NextResponse.json({ ok: true });
}
