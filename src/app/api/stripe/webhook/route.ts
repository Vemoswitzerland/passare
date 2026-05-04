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
 * - customer.subscription.created   → tier auf 'plus' / 'max' setzen
 * - customer.subscription.updated   → tier sync (active/canceled)
 * - customer.subscription.deleted   → tier auf 'basic' zurücksetzen
 * - invoice.payment_succeeded       → renewed_at aktualisieren + Zahlung loggen
 *
 * Idempotency: Vor dem switch wird gecheckt, ob `event.id` schon in
 * `stripe_events` steht. Wenn ja → no-op-Response. Sonst nach
 * erfolgreichem Handling Insert.
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

  // ── Idempotency-Check (Stripe sendet Events at-least-once) ──
  try {
    const { data: existing } = await admin
      .from('stripe_events')
      .select('id')
      .eq('id', event.id)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ received: true, idempotent: true });
    }
  } catch {
    // stripe_events-Tabelle existiert evtl. noch nicht — nicht blockieren
  }

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
        const renewedAt = sub.current_period_start
          ? new Date(sub.current_period_start * 1000).toISOString()
          : null;
        const interval = sub.metadata?.interval ?? 'monthly';

        // Broker-Subscription
        if (isBrokerTier) {
          const brokerTier = tier === 'broker_pro' ? 'pro' : 'starter';
          const mandateLimit = brokerTier === 'pro' ? 25 : 5;
          const teamSeats = brokerTier === 'pro' ? 5 : 0;

          await admin
            .from('broker_profiles')
            .upsert(
              {
                id: userId,
                tier: brokerTier,
                mandate_limit: mandateLimit,
                team_seats_limit: teamSeats,
                subscription_status: isActive ? 'active' : 'canceled',
                stripe_subscription_id: sub.id,
                subscription_interval: interval,
                subscription_renewed_at: renewedAt,
                subscription_cancel_at: cancelAt,
              },
              { onConflict: 'id' },
            );

          await admin
            .from('profiles')
            .upsert({ id: userId, is_broker: isActive }, { onConflict: 'id' });
        }

        // Käufer-Subscription
        if (isKaeuferTier) {
          // Bug-Fix: vorher hardcoded 'plus' — jetzt korrekter Tier aus Metadata.
          const targetTier = tier === 'max' ? 'max' : 'plus';
          await admin
            .from('profiles')
            .upsert(
              {
                id: userId,
                subscription_tier: isActive ? targetTier : 'basic',
                stripe_subscription_id: sub.id,
                subscription_renewed_at: renewedAt,
                subscription_cancel_at: cancelAt,
              },
              { onConflict: 'id' },
            );
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
            .upsert(
              {
                id: userId,
                subscription_status: 'canceled',
                stripe_subscription_id: null,
                subscription_cancel_at: new Date().toISOString(),
              },
              { onConflict: 'id' },
            );

          await admin
            .from('profiles')
            .upsert({ id: userId, is_broker: false }, { onConflict: 'id' });

          // Aktive Mandate pausieren — sonst bleiben sie public sichtbar.
          // Vor dem Update Liste fetchen, damit wir Verkäufer benachrichtigen können.
          const { data: pausedListings } = await admin
            .from('inserate')
            .select('id, titel, verkaeufer_id')
            .eq('broker_id', userId)
            .eq('status', 'live');

          await admin
            .from('inserate')
            .update({ status: 'pausiert', paused_at: new Date().toISOString() })
            .eq('broker_id', userId)
            .eq('status', 'live');

          // Pro pausiertem Inserat eine Mail an den Verkäufer (sofern vorhanden).
          if (Array.isArray(pausedListings) && pausedListings.length > 0) {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://passare-ch.vercel.app';
            for (const listing of pausedListings) {
              if (!listing.verkaeufer_id) continue;
              const { data: ownerData } = await admin.auth.admin.getUserById(listing.verkaeufer_id);
              const email = ownerData?.user?.email;
              if (!email) continue;
              const safeTitel = String(listing.titel ?? '').replace(/[\r\n]/g, ' ').slice(0, 150);
              void sendEmail({
                // Note: Eigenes 'inserat_pausiert'-Template existiert nicht
                // (TODO: Phase 2). Nutzen 'inserat_bald_abgelaufen' als
                // semantisch verwandtes Template + subject_override.
                template: 'inserat_bald_abgelaufen',
                to: email,
                vars: {
                  inseratTitel: safeTitel,
                  link: `${appUrl}/dashboard/verkaeufer`,
                  reason: 'broker_subscription_canceled',
                },
                subject_override: `Dein Inserat «${safeTitel}» wurde pausiert`,
                user_id: listing.verkaeufer_id,
                related_id: listing.id,
              });
            }
          }
        } else {
          await admin
            .from('profiles')
            .upsert(
              {
                id: userId,
                subscription_tier: 'basic',
                stripe_subscription_id: null,
                subscription_cancel_at: null,
              },
              { onConflict: 'id' },
            );
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

    // ── Idempotency-Marker erst NACH erfolgreichem Handling setzen ──
    try {
      await admin.from('stripe_events').insert({ id: event.id, type: event.type });
    } catch {
      // Tabelle existiert evtl. noch nicht / Race-Condition mit Doppel-Webhook → ignorieren
    }
  } catch (err) {
    console.error('[stripe-webhook] processing error:', err);
    return NextResponse.json({ error: 'Verarbeitung fehlgeschlagen' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
