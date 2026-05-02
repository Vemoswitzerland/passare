import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

/**
 * MOCKUP — Broker Checkout
 *
 * Aktuell läuft kein echter Stripe-Flow. Der Endpoint setzt direkt
 * broker_profiles.subscription_status='active' + tier/mandate_limit
 * passend zum gewählten Paket und routet zurück ins Broker-Dashboard.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const tier = searchParams.get('tier') ?? 'starter';
  const interval = searchParams.get('interval') === 'yearly' ? 'yearly' : 'monthly';

  if (!['starter', 'pro'].includes(tier)) {
    return NextResponse.redirect(new URL('/dashboard/broker/paket?error=invalid_tier', req.url));
  }

  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return NextResponse.redirect(new URL('/auth/login', req.url));

  const admin = createAdminClient();

  // Sicherstellen dass ein broker_profiles-Row existiert
  const { data: existing } = await admin
    .from('broker_profiles')
    .select('id')
    .eq('id', u.user.id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.redirect(
      new URL('/onboarding/broker/tunnel?error=profile_missing', req.url),
    );
  }

  const mandateLimit = tier === 'pro' ? 25 : 5;
  const teamSeats = tier === 'pro' ? 5 : 0;

  await admin
    .from('broker_profiles')
    .update({
      tier,
      mandate_limit: mandateLimit,
      team_seats_limit: teamSeats,
      subscription_status: 'active',
      subscription_interval: interval,
      subscription_renewed_at: new Date().toISOString(),
      subscription_cancel_at: null,
    })
    .eq('id', u.user.id);

  await admin
    .from('profiles')
    .update({ is_broker: true })
    .eq('id', u.user.id);

  if (u.user.email) {
    void sendEmail({
      template: 'welcome',
      to: u.user.email,
      vars: { rolle: 'broker', tier: `broker_${tier}`, mock: true, interval },
      user_id: u.user.id,
    });
  }

  return NextResponse.redirect(new URL('/dashboard/broker?welcome=1', req.url), { status: 303 });
}
