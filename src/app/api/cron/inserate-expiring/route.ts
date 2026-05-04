/**
 * Vercel-Cron-Endpoint: täglich Inserate prüfen die in 14 Tagen ablaufen.
 *
 * Sendet `inserat_bald_abgelaufen`-Mail an Verkäufer pro Inserat,
 * markiert `last_expiry_notice_at = now()` damit derselbe Verkäufer
 * nicht jeden Tag eine Erinnerung bekommt.
 *
 * Auth: Bearer-Token = `process.env.CRON_SECRET`
 *   (Vercel setzt das Header automatisch wenn `vercel.json` einen
 *   `crons`-Eintrag hat und `CRON_SECRET` im Env-Set steht.)
 *
 * Vercel-Schedule (siehe vercel.json): täglich 06:00 UTC = 07:00/08:00 CH.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const WINDOW_DAYS = 14;
// Min Tage zwischen zwei Erinnerungs-Mails an denselben Verkäufer.
// Verhindert, dass jemand am Tag 14 + Tag 13 + Tag 12 ... 14x angepingt wird.
const RENOTIFY_DAYS = 7;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? '';
  const expected = process.env.CRON_SECRET;

  if (!expected) {
    return NextResponse.json({ error: 'CRON_SECRET nicht konfiguriert' }, { status: 503 });
  }
  if (authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();
  const windowEnd = new Date(now.getTime() + WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const renotifyCutoff = new Date(now.getTime() - RENOTIFY_DAYS * 24 * 60 * 60 * 1000);

  // Inserate finden die:
  //   - status='live' sind
  //   - in den nächsten 14 Tagen ablaufen
  //   - in den letzten 7 Tagen noch keine Erinnerung bekommen haben
  const { data: rows, error } = await admin
    .from('inserate')
    .select('id, titel, expires_at, verkaeufer_id, last_expiry_notice_at')
    .eq('status', 'live')
    .gt('expires_at', now.toISOString())
    .lte('expires_at', windowEnd.toISOString())
    .or(
      `last_expiry_notice_at.is.null,last_expiry_notice_at.lte.${renotifyCutoff.toISOString()}`,
    );

  if (error) {
    console.error('[cron:inserate-expiring] Query-Fehler:', error.message);
    return NextResponse.json({ error: 'Query fehlgeschlagen', detail: error.message }, { status: 500 });
  }

  const results: { inserat_id: string; sent: boolean; reason?: string }[] = [];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://passare.ch';

  for (const row of rows ?? []) {
    if (!row.verkaeufer_id || !row.expires_at) {
      results.push({ inserat_id: row.id, sent: false, reason: 'kein verkaeufer_id oder expires_at' });
      continue;
    }

    const { data: ownerData } = await admin.auth.admin.getUserById(row.verkaeufer_id);
    const ownerEmail = ownerData?.user?.email;
    if (!ownerEmail) {
      results.push({ inserat_id: row.id, sent: false, reason: 'keine email' });
      continue;
    }

    const expiresAt = new Date(row.expires_at);
    const tageVerbleibend = Math.max(0, Math.ceil(
      (expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
    ));
    const safeTitel = String(row.titel ?? '').replace(/[\r\n]/g, ' ').slice(0, 150);

    await sendEmail({
      template: 'inserat_bald_abgelaufen',
      to: ownerEmail,
      vars: {
        inseratTitel:    safeTitel,
        inseratId:       row.id,
        tageVerbleibend,
        abgelaufenAm:    expiresAt.toLocaleDateString('de-CH'),
        appUrl,
      },
      subject_override: `Inserat «${safeTitel}» läuft in ${tageVerbleibend} Tagen ab`,
      user_id: row.verkaeufer_id,
      related_id: row.id,
    });

    // Marker setzen — auch wenn der Mail-Versand fire-and-forget ist:
    // Bei Fehler wartet der nächste Cron-Run sowieso wieder
    // RENOTIFY_DAYS bevor er retried, was in Ordnung ist.
    await admin
      .from('inserate')
      .update({ last_expiry_notice_at: now.toISOString() })
      .eq('id', row.id);

    results.push({ inserat_id: row.id, sent: true });
  }

  return NextResponse.json({
    ok: true,
    checked: rows?.length ?? 0,
    sent: results.filter(r => r.sent).length,
    skipped: results.filter(r => !r.sent).length,
    details: results,
  });
}
