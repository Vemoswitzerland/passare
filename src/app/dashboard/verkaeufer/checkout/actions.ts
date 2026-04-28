'use server';

import { createClient } from '@/lib/supabase/server';
import { POWERUPS, PAKETE, type PaketTier } from '@/data/pakete';

type PayInput = {
  inseratId: string;
  paketId: string;
  powerupIds: string[];
};

type PayResult = { ok: true } | { ok: false; error: string };

/**
 * Mock-Zahlungsaktion. In Production würde hier eine echte Stripe-
 * Checkout-Session erstellt + Webhook-Bestätigung. V1 markiert sofort
 * alles als bezahlt — DEMO-Modus für die UX-Tests.
 */
export async function mockPayAction(input: PayInput): Promise<PayResult> {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return { ok: false, error: 'Nicht angemeldet' };

  // Simuliere Stripe-Verarbeitungs-Delay (für realistisches Gefühl)
  await new Promise((r) => setTimeout(r, 1500));

  const paket = PAKETE[input.paketId as PaketTier];
  if (!paket) return { ok: false, error: 'Unbekanntes Paket' };

  // 1. Inserat als bezahlt markieren — paid_at + paket
  const { error: updErr } = await supabase
    .from('inserate')
    .update({
      paket: paket.id,
      paid_at: new Date().toISOString(),
      status: 'zur_pruefung',
    })
    .eq('id', input.inseratId)
    .eq('verkaeufer_id', u.user.id);

  if (updErr) {
    return { ok: false, error: `Inserat-Update fehlgeschlagen: ${updErr.message}` };
  }

  // 2. Powerups buchen
  if (input.powerupIds.length > 0) {
    const now = new Date();
    const rows = input.powerupIds
      .map((puId) => {
        const meta = POWERUPS.find((x) => x.id === puId);
        if (!meta) return null;
        const laeuftBis = meta.einheit.includes('Tage') || meta.einheit.includes('Woche')
          ? new Date(now.getTime() + parseDuration(meta.einheit) * 24 * 60 * 60 * 1000).toISOString()
          : null;
        return {
          inserat_id: input.inseratId,
          powerup_id: puId,
          menge: 1,
          preis_chf: meta.preis,
          bezahlt_at: now.toISOString(),
          aktiviert_at: now.toISOString(),
          laeuft_bis: laeuftBis,
          status: laeuftBis ? 'active' : 'paid',
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    if (rows.length > 0) {
      const { error: puErr } = await supabase.from('inserat_powerups').insert(rows);
      if (puErr) {
        // Inserat ist trotzdem bezahlt — Powerups schlagen wir als
        // Warnung, blockieren aber den Erfolg nicht
        console.warn('[checkout] powerups insert failed:', puErr);
      }
    }
  }

  return { ok: true };
}

function parseDuration(label: string): number {
  // '7 Tage' → 7, '30 Tage' → 30, '1 Woche' → 7
  const m = label.match(/(\d+)/);
  if (!m) return 30;
  const n = parseInt(m[1], 10);
  if (label.includes('Woche')) return n * 7;
  return n;
}
