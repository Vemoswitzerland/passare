import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Stripe-Webhook für Käufer-Subscriptions (Käufer+-Abo).
 *
 * Events die wir handhaben:
 * - customer.subscription.created   ��� tier auf 'plus' setzen
 * - customer.subscription.updated   → tier sync (active/canceled)
 * - customer.subscription.deleted   → tier auf 'basic' zurücksetzen
 * - invoice.payment_succeeded       → renewed_at aktualisieren + Zahlung loggen
 */
export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe-Webhook nicht konfiguriert' }, { status: 503 });
  }

  const stripe = new Stripe(secretKey, { apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion });
  const sig = req.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: `Webhook-Signatur ungültig: ${(err as Error).message}` }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const tier = sub.metadata?.tier;
        const userId = sub.metadata?.user_id;
        if (!userId) break;

        const isBrokerTier = tier === 'broker_starter' || tier === 'broker_pro';
        const isKaeuferTier = tier === 'plus' || tier === 'max';
        if (!isBrokerTier && !isKaeuferTier) break;

        const isActive = sub.status === 'active' || sub.status === 'trialing';
        const cancelAt = sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null;
        const interval = sub.metadata?.interval ?? 'monthly';

        // Broker-Subscription
        if (isBrokerTier) {
          const brokerTier = tier === 'broker_pro' ? 'pro' : 'starter';
          const mandateLimit = brokerTier === 'pro' ? 25 : 5;
          const teamSeats = brokerTier === 'pro' ? 5 : 0;

          await admin
            .from('broker_profiles')
            .update({
              tier: brokerTier,
              mandate_limit: mandateLimit,
              team_seats_limit: teamSeats,
              subscription_status: isActive ? 'active' : 'canceled',
              stripe_subscription_id: sub.id,
              subscription_interval: interval,
              subscription_renewed_at: new Date(sub.current_period_start * 1000).toISOString(),
              subscription_cancel_at: cancelAt,
            })
            .eq('id', userId);

          await admin
            .from('profiles')
            .update({ is_broker: isActive })
            .eq('id', userId);
        }

        // Käufer-Subscription
        if (isKaeuferTier) {
          await admin
            .from('profiles')
            .update({
              subscription_tier: isActive ? 'plus' : 'basic',
              stripe_subscription_id: sub.id,
              subscription_renewed_at: new Date(sub.current_period_start * 1000).toISOString(),
              subscription_cancel_at: cancelAt,
            })
            .eq('id', userId);
        }

        if (event.type === 'customer.subscription.created' && isActive) {
          const { data: authUser } = await admin.auth.admin.getUserById(userId);
          if (authUser?.user?.email) {
            void sendEmail({
              template: 'welcome',
              to: authUser.user.email,
              vars: { rolle: isBrokerTier ? 'broker' : 'kaeufer', tier: tier ?? 'plus' },
              user_id: userId,
            });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;
        const tier = sub.metadata?.tier;
        if (!userId) break;

        const isBrokerTier = tier === 'broker_starter' || tier === 'broker_pro';

        if (isBrokerTier) {
          await admin
            .from('broker_profiles')
            .update({
              subscription_status: 'inactive',
              stripe_subscription_id: null,
              subscription_cancel_at: null,
            })
            .eq('id', userId);

          await admin
            .from('profiles')
            .update({ is_broker: false })
            .eq('id', userId);
        } else {
          await admin
            .from('profiles')
            .update({
              subscription_tier: 'basic',
              stripe_subscription_id: null,
              subscription_cancel_at: null,
            })
            .eq('id', userId);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const inv = event.data.object as Stripe.Invoice;
        const customerId = typeof inv.customer === 'string' ? inv.customer : inv.customer?.id;
        if (!customerId) break;

        const { data: profile } = await admin
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();

        if (!profile) break;

        // Defensiv: nur in zahlungen-Tabelle schreiben wenn sie existiert (Chat 2 ownt sie)
        try {
          await admin.from('zahlungen').insert({
            user_id: profile.id,
            stripe_event_id: event.id,
            stripe_invoice_id: inv.id,
            amount_net: inv.subtotal,
            vat_rate: 8.1,
            vat_amount: inv.tax ?? 0,
            amount_gross: inv.total,
            currency: inv.currency,
            pdf_url: inv.invoice_pdf,
          });
        } catch {
          // zahlungen-Tabelle existiert noch nicht — egal, wir loggen nur
        }
        break;
      }

      default:
        // Andere Events (refunds, disputes, ...) — Chat 2 / Admin-Bereich
        break;
    }
  } catch (err) {
    console.error('[stripe-webhook] processing error:', err);
    return NextResponse.json({ error: 'Verarbeitung fehlgeschlagen' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
