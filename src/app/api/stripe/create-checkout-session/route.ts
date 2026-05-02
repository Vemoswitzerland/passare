import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // Stripe-Konfiguration prüfen
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: 'Stripe ist noch nicht konfiguriert. Bitte später nochmal versuchen.' },
      { status: 503 },
    );
  }

  // Form-Daten lesen (kann FormData oder JSON sein)
  let tier = 'plus';
  let interval: 'monthly' | 'yearly' = 'monthly';
  const ct = req.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    const body = await req.json().catch(() => ({}));
    tier = body.tier ?? 'plus';
    interval = body.interval === 'yearly' ? 'yearly' : 'monthly';
  } else {
    const fd = await req.formData();
    tier = String(fd.get('tier') ?? 'plus');
    interval = fd.get('interval') === 'yearly' ? 'yearly' : 'monthly';
  }

  if (tier !== 'plus' && tier !== 'max') {
    return NextResponse.json({ error: 'Ungültiger Tier' }, { status: 400 });
  }

  const priceId = interval === 'yearly'
    ? (process.env.STRIPE_PRICE_PLUS_YEARLY ?? process.env.STRIPE_PRICE_MAX_YEARLY)
    : (process.env.STRIPE_PRICE_PLUS_MONTHLY ?? process.env.STRIPE_PRICE_MAX_MONTHLY);

  if (!priceId) {
    return NextResponse.json(
      { error: `Stripe-Preis-ID für ${interval} fehlt (STRIPE_PRICE_MAX_${interval.toUpperCase()}).` },
      { status: 503 },
    );
  }

  // User auth
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return NextResponse.redirect(new URL('/auth/login', req.url));

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, full_name')
    .eq('id', u.user.id)
    .maybeSingle();

  const stripe = new Stripe(secretKey, { apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion });

  // Stripe-Customer ggf. anlegen
  let customerId = profile?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: u.user.email ?? undefined,
      name: profile?.full_name ?? undefined,
      metadata: { user_id: u.user.id, role: 'kaeufer' },
    });
    customerId = customer.id;
    const admin = createAdminClient();
    await admin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', u.user.id);
  }

  // Origin
  const origin = req.nextUrl.origin;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard/kaeufer?welcome=plus`,
    cancel_url: `${origin}/onboarding/kaeufer/paket?canceled=1&interval=${interval}`,
    allow_promotion_codes: true,
    automatic_tax: { enabled: true },
    metadata: { user_id: u.user.id, tier: 'plus', interval },
    subscription_data: {
      metadata: { user_id: u.user.id, tier: 'plus', interval },
    },
  });

  if (!session.url) {
    return NextResponse.json({ error: 'Stripe-Session konnte nicht erstellt werden' }, { status: 500 });
  }

  return NextResponse.redirect(session.url, { status: 303 });
}
