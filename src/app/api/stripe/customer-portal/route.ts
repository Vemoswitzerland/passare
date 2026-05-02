import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * MOCKUP — Customer-Portal
 *
 * Solange Stripe nur Mockup ist, gibt es kein echtes Billing-Portal.
 * Wir routen den User zurück zur Abo-Seite mit einem Info-Hinweis.
 */
async function handle(req: NextRequest) {
  const ctx = req.nextUrl.searchParams.get('ctx');
  const returnPath = ctx === 'broker' ? '/dashboard/broker/paket' : '/dashboard/kaeufer/abo';
  return NextResponse.redirect(new URL(`${returnPath}?info=stripe_mock`, req.url), { status: 303 });
}

export const GET = handle;
export const POST = handle;
