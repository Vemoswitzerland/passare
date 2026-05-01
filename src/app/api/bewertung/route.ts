import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { calculateBewertung, type Multiples } from '@/app/bewerten/calc';

export const runtime = 'nodejs';

const InputSchema = z.object({
  branche: z.string().min(2).max(60),
  mitarbeitende: z.number().int().min(0).max(5000),
  umsatz_chf: z.number().min(0).max(1_000_000_000),
  ebitda_pct: z.number().min(-50).max(80),
  kanton: z.string().length(2),
  wachstum_pct: z.number().min(-50).max(200),
  // Detail-Faktoren — alle optional, Engine nutzt safe defaults.
  recurring_pct: z.number().min(0).max(100).optional().nullable(),
  top3_kunden_pct: z.number().min(0).max(100).optional().nullable(),
  inhaberabhaengigkeit: z.enum(['low', 'mid', 'high']).optional().nullable(),
  alter_jahre: z.number().int().min(0).max(300).optional().nullable(),
  email: z.string().email().optional().nullable(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiger Request-Body' }, { status: 400 });
  }

  const parse = InputSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json(
      { error: 'Validierungsfehler', issues: parse.error.flatten() },
      { status: 400 },
    );
  }

  const input = parse.data;
  const supabase = await createClient();

  // Multiples aus DB laden (Public-RLS)
  const { data: mult, error: multErr } = await supabase
    .from('kmu_multiples')
    .select('branche, ebitda_multiple_min, ebitda_multiple_max, umsatz_multiple_min, umsatz_multiple_max, quelle')
    .eq('branche', input.branche)
    .maybeSingle();

  if (multErr || !mult) {
    return NextResponse.json(
      { error: `Keine Multiples für Branche "${input.branche}" hinterlegt.` },
      { status: 404 },
    );
  }

  const multiples: Multiples = {
    branche: mult.branche,
    ebitda_multiple_min: Number(mult.ebitda_multiple_min),
    ebitda_multiple_max: Number(mult.ebitda_multiple_max),
    umsatz_multiple_min: mult.umsatz_multiple_min != null ? Number(mult.umsatz_multiple_min) : null,
    umsatz_multiple_max: mult.umsatz_multiple_max != null ? Number(mult.umsatz_multiple_max) : null,
    quelle: mult.quelle,
  };

  const result = calculateBewertung({
    branche: input.branche,
    mitarbeitende: input.mitarbeitende,
    umsatz_chf: input.umsatz_chf,
    ebitda_pct: input.ebitda_pct,
    kanton: input.kanton,
    wachstum_pct: input.wachstum_pct,
    recurring_pct: input.recurring_pct ?? undefined,
    top3_kunden_pct: input.top3_kunden_pct ?? undefined,
    inhaberabhaengigkeit: input.inhaberabhaengigkeit ?? undefined,
    alter_jahre: input.alter_jahre ?? undefined,
    multiples,
  });

  // Persist (Anon-INSERT erlaubt via RLS-Policy)
  const userAgent = req.headers.get('user-agent') ?? null;
  const ipRaw =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    null;
  const ipHash = ipRaw ? await sha256Short(ipRaw) : null;

  const { error: insErr } = await supabase.from('bewertungs_anfragen').insert({
    email: input.email ?? null,
    branche: input.branche,
    kennzahlen: {
      mitarbeitende: input.mitarbeitende,
      umsatz_chf: input.umsatz_chf,
      ebitda_pct: input.ebitda_pct,
      kanton: input.kanton,
      wachstum_pct: input.wachstum_pct,
      recurring_pct: input.recurring_pct ?? null,
      top3_kunden_pct: input.top3_kunden_pct ?? null,
      inhaberabhaengigkeit: input.inhaberabhaengigkeit ?? null,
      alter_jahre: input.alter_jahre ?? null,
    },
    ergebnis: result,
    user_agent: userAgent,
    ip_hash: ipHash,
  });

  if (insErr) {
    // Loggen, aber Antwort trotzdem zurückgeben (User-Tool darf nicht hängen)
    console.error('[bewertung] insert failed:', insErr.message);
  }

  return NextResponse.json({
    ok: true,
    result,
    pdf_pending: input.email ? true : false,
  });
}

async function sha256Short(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input + ':passare-salt');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
