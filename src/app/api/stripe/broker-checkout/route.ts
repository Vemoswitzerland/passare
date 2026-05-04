import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { sendWelcomeOnce } from '@/lib/email';

export const dynamic = 'force-dynamic';

/**
 * MOCKUP — Broker Checkout (POST + JSON)
 *
 * Aktuell läuft kein echter Stripe-Flow. Der Endpoint setzt direkt
 * broker_profiles.subscription_status='active' + tier/mandate_limit
 * passend zum gewählten Paket und routet zurück ins Broker-Dashboard.
 *
 * Sicherheits-Hinweis:
 *  - POST + JSON statt GET (CSRF-Schutz, keine Side-Effects via Link).
 *  - Production-Schutz via STRIPE_MOCK_ALLOWED.
 *
 * Body: { tier: 'starter'|'pro', interval?: 'monthly'|'yearly' }
 * Response: { ok: true, redirect: string }  (Frontend macht den window.location.href)
 */
export async function POST(req: NextRequest) {
  // Production-Schutz
  if (process.env.STRIPE_MOCK_ALLOWED !== 'true') {
    return NextResponse.json({ error: 'mock_disabled' }, { status: 501 });
  }

  // Content-Type-Check (CSRF: nur JSON, kein Form-POST)
  const ct = req.headers.get('content-type') ?? '';
  if (!ct.toLowerCase().includes('application/json')) {
    return NextResponse.json({ error: 'unsupported_content_type' }, { status: 415 });
  }

  let payload: { tier?: string; interval?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const tier = (payload.tier ?? 'starter').toString();
  const interval = payload.interval === 'yearly' ? 'yearly' : 'monthly';

  if (!['starter', 'pro'].includes(tier)) {
    return NextResponse.json({ error: 'invalid_tier' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from('broker_profiles')
    .select('id, subscription_status, tier')
    .eq('id', u.user.id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json(
      { error: 'profile_missing', redirect: '/onboarding/broker/tunnel?error=profile_missing' },
      { status: 404 },
    );
  }

  const mandateLimit = tier === 'pro' ? 25 : 5;
  const teamSeats = tier === 'pro' ? 5 : 0;
  const wasActive = existing.subscription_status === 'active';
  const isFirstActivation = !wasActive;

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

  revalidatePath('/dashboard/broker', 'layout');

  if (isFirstActivation && u.user.email) {
    void sendWelcomeOnce(admin, u.user.id, u.user.email, {
      rolle: 'broker', tier: `broker_${tier}`, mock: true, interval,
    });
  }

  return NextResponse.json({
    ok: true,
    redirect: '/dashboard/broker/welcome?paid=1&next=/dashboard/broker',
  });
}
