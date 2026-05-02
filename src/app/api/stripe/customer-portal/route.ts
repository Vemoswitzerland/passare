import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function handle(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: 'Stripe nicht konfiguriert' }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return NextResponse.redirect(new URL('/auth/login', req.url));

  const ctx = req.nextUrl.searchParams.get('ctx');
  const returnPath = ctx === 'broker' ? '/dashboard/broker/paket' : '/dashboard/kaeufer/abo';

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', u.user.id)
    .maybeSingle();

  if (!profile?.stripe_customer_id) {
    return NextResponse.redirect(new URL(`${returnPath}?error=no_customer`, req.url));
  }

  const stripe = new Stripe(secretKey, { apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion });
  const origin = req.nextUrl.origin;

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${origin}${returnPath}`,
  });

  return NextResponse.redirect(session.url, { status: 303 });
}

export const GET = handle;
export const POST = handle;
