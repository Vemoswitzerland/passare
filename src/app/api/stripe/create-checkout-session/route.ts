import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

/**
 * MOCKUP — Käufer+ Checkout
 *
 * Aktuell läuft kein echter Stripe-Flow. Der Endpoint setzt direkt
 * subscription_tier='plus' für den eingeloggten User und schickt ihn
 * zurück ins Dashboard mit ?welcome=plus.
 *
 * Sobald Stripe live geht, wird hier die richtige Checkout-Session
 * gebaut (Code in Git-History).
 */
export async function POST(req: NextRequest) {
  let interval: 'monthly' | 'yearly' = 'monthly';
  const ct = req.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    const body = await req.json().catch(() => ({}));
    interval = body.interval === 'yearly' ? 'yearly' : 'monthly';
  } else {
    const fd = await req.formData();
    interval = fd.get('interval') === 'yearly' ? 'yearly' : 'monthly';
  }

  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) {
    if (ct.includes('application/json')) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  const admin = createAdminClient();

  await admin
    .from('profiles')
    .update({
      subscription_tier: 'plus',
      subscription_renewed_at: new Date().toISOString(),
      subscription_cancel_at: null,
    })
    .eq('id', u.user.id);

  if (u.user.email) {
    void sendEmail({
      template: 'welcome',
      to: u.user.email,
      vars: { rolle: 'kaeufer', tier: 'plus', mock: true, interval },
      user_id: u.user.id,
    });
  }

  return NextResponse.redirect(new URL('/dashboard/kaeufer?welcome=plus', req.url), { status: 303 });
}
