import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const tier = searchParams.get('tier') ?? 'starter';
  const interval = searchParams.get('interval') === 'yearly' ? 'yearly' : 'monthly';

  if (!['starter', 'pro'].includes(tier)) {
    return NextResponse.redirect(new URL('/dashboard/broker/paket?error=invalid_tier', req.url));
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    // Statt JSON-503 lieber freundlich auf die Paket-Seite leiten —
    // dort sieht der User einen sauberen Hinweis statt rohe API-Fehler.
    return NextResponse.redirect(
      new URL('/dashboard/broker/paket?error=stripe_not_configured', req.url),
    );
  }

  const priceEnvKey = `STRIPE_PRICE_BROKER_${tier.toUpperCase()}_${interval.toUpperCase()}`;
  const priceId = process.env[priceEnvKey];

  if (!priceId) {
    return NextResponse.redirect(
      new URL(`/dashboard/broker/paket?error=stripe_price_missing&tier=${tier}&interval=${interval}`, req.url),
    );
  }

  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return NextResponse.redirect(new URL('/auth/login', req.url));

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, full_name')
    .eq('id', u.user.id)
    .maybeSingle();

  const stripe = new Stripe(secretKey, { apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion });

  let customerId = profile?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: u.user.email ?? undefined,
      name: profile?.full_name ?? undefined,
      metadata: { user_id: u.user.id, role: 'broker' },
    });
    customerId = customer.id;
    const admin = createAdminClient();
    await admin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', u.user.id);
  }

  const origin = req.nextUrl.origin;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard/broker?welcome=1`,
    cancel_url: `${origin}/dashboard/broker/paket?canceled=1`,
    allow_promotion_codes: true,
    automatic_tax: { enabled: true },
    metadata: { user_id: u.user.id, tier: `broker_${tier}`, interval },
    subscription_data: {
      metadata: { user_id: u.user.id, tier: `broker_${tier}`, interval },
    },
  });

  if (!session.url) {
    return NextResponse.json({ error: 'Stripe-Session konnte nicht erstellt werden' }, { status: 500 });
  }

  return NextResponse.redirect(session.url, { status: 303 });
}
