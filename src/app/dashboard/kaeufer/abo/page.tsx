import Link from 'next/link';
import {
  Crown, Check, X, ArrowRight, CreditCard, FileText, Zap, Bell,
  MessageSquare, FileLock2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { hasTable } from '@/lib/db/has-table';
import { cn } from '@/lib/utils';
import { isPlusKaeufer } from '@/lib/kaeufer/is-plus';

export const metadata = { title: 'Käufer+-Abo — passare', robots: { index: false, follow: false } };

export default async function AboPage() {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, is_broker, subscription_renewed_at, subscription_cancel_at, stripe_customer_id, stripe_subscription_id')
    .eq('id', u.user.id)
    .maybeSingle();

  const isPlus = isPlusKaeufer(profile);
  const isBroker = profile?.is_broker === true;

  let zahlungen: { id: string; amount_gross: number; created_at: string; pdf_url?: string | null }[] = [];
  if (await hasTable('zahlungen')) {
    const { data } = await supabase
      .from('zahlungen')
      .select('*')
      .eq('user_id', u.user.id)
      .order('created_at', { ascending: false })
      .limit(12);
    zahlungen = (data ?? []) as typeof zahlungen;
  }

  return (
    <div className="space-y-8 max-w-content">
      <div>
        <p className="overline text-bronze mb-2">Abonnement · Zahlungen · Rechnungen</p>
        <h1 className="font-serif text-display-sm md:text-head-lg text-navy font-light">
          Käufer+-Abo<span className="text-bronze">.</span>
        </h1>
        <p className="text-body-sm text-muted mt-2 max-w-2xl">
          Hier verwaltest du dein Käufer-Abonnement, siehst alle Zahlungen und kannst jederzeit upgraden, downgraden oder pausieren.
        </p>
      </div>

      {/* Aktueller Status */}
      <div className={cn(
        'rounded-card p-7',
        isPlus ? 'bg-navy text-cream' : 'bg-paper border border-stone',
      )}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {isPlus && <Crown className="w-4 h-4 text-bronze" strokeWidth={1.5} />}
              <p className={cn('overline', isPlus ? 'text-bronze' : 'text-bronze-ink')}>
                Aktueller Plan
              </p>
            </div>
            <h2 className={cn('font-serif text-head-lg font-normal',
              isPlus ? 'text-cream' : 'text-navy',
            )}>
              {isPlus ? 'Käufer+' : 'Käufer Basic'}<span className="text-bronze">.</span>
            </h2>
            <p className={cn('text-body-sm mt-2', isPlus ? 'text-cream/80' : 'text-muted')}>
              {isPlus
                ? `Aktiv${profile?.subscription_renewed_at ? ` seit ${new Date(profile.subscription_renewed_at).toLocaleDateString('de-CH')}` : ''}.`
                : 'Du nutzt aktuell die kostenlose Variante.'}
            </p>
            {profile?.subscription_cancel_at && (
              <p className="text-caption text-warn mt-2">
                Wird gekündigt zum {new Date(profile.subscription_cancel_at).toLocaleDateString('de-CH')}
              </p>
            )}
          </div>

          {isPlus && profile?.stripe_customer_id ? (
            <form action="/api/stripe/customer-portal" method="post">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-bronze text-cream rounded-soft text-body-sm font-medium hover:bg-bronze-ink transition-colors"
              >
                <CreditCard className="w-4 h-4" strokeWidth={1.5} />
                Bezahlung verwalten
              </button>
            </form>
          ) : (
            <form action="/api/stripe/create-checkout-session" method="post">
              <input type="hidden" name="tier" value="plus" />
              <input type="hidden" name="interval" value="monthly" />
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-bronze text-cream rounded-soft text-body-sm font-medium hover:bg-bronze-ink transition-colors"
              >
                Auf Käufer+ upgraden <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Tier-Vergleich */}
      <section>
        <h2 className="font-serif text-head-md text-navy font-normal mb-4">
          Was bringt Käufer+<span className="text-bronze">?</span>
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <PlanCompareCard
            title="Basic"
            price="CHF 0"
            interval="/ unbefristet"
            current={!isPlus}
            features={[
              { text: 'Öffentliche Inserate', has: true },
              { text: 'Alle 18 Filter', has: true },
              { text: 'Gespeicherte Suchen', has: true },
              { text: 'Wöchentlicher E-Mail-Digest', has: true },
              { text: 'Geschlossene Inserate', has: false },
              { text: '7 Tage Frühzugang', has: false },
              { text: 'Echtzeit-E-Mail-Alerts', has: false },
              { text: 'Eigenes Logo im Käuferprofil', has: false },
            ]}
          />
          <PlanCompareCard
            title="Käufer+"
            price="CHF 199"
            interval="/ Monat (oder CHF 1'990/Jahr)"
            current={isPlus}
            highlighted
            features={[
              { text: 'Öffentliche Inserate', has: true },
              { text: 'Alle 18 Filter', has: true },
              { text: 'Gespeicherte Suchen', has: true },
              { text: 'Geschlossene Inserate sehen', has: true },
              { text: '7 Tage Frühzugang auf neue Inserate', has: true },
              { text: 'Echtzeit-E-Mail-Alerts bei Match', has: true },
              { text: 'Eigenes Logo im Käuferprofil', has: true },
            ]}
          />
        </div>
      </section>

      {/* Käufer+ in Zahlen */}
      <section className="bg-paper border border-stone rounded-card p-6 md:p-8">
        <h2 className="font-serif text-head-md text-navy font-normal mb-5">
          Käufer+ in Zahlen<span className="text-bronze">.</span>
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ROIStat icon={Zap} value="7 Tage" label="Frühzugang vor Basic" />
          <ROIStat icon={Bell} value="Echtzeit" label="E-Mail-Alerts bei Match" />
          <ROIStat icon={MessageSquare} value="100 %" label="Alle Inserate sichtbar" />
          <ROIStat icon={FileLock2} value="Logo" label="Trust-Signal im Profil" />
        </div>
        <p className="text-caption text-quiet mt-5 leading-relaxed border-t border-stone pt-4">
          Die meisten Top-Inserate werden in den ersten 7 Tagen weggeschnappt. Mit Basic siehst du sie erst, wenn diese Phase fast vorbei ist.
        </p>
      </section>

      {/* Rechnungen */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-head-sm text-navy font-normal">Rechnungen</h2>
          <span className="font-mono text-caption text-quiet">{zahlungen.length} Eintrag{zahlungen.length !== 1 && 'e'}</span>
        </div>
        {zahlungen.length === 0 ? (
          <div className="bg-paper border border-dashed border-stone rounded-card p-8 text-center">
            <FileText className="w-6 h-6 text-quiet mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-body-sm text-muted">
              Sobald du eine Käufer+-Zahlung tätigst, erscheint hier die Rechnung als PDF zum Download.
            </p>
          </div>
        ) : (
          <div className="bg-paper border border-stone rounded-card overflow-hidden">
            <ul className="divide-y divide-stone">
              {zahlungen.map((z) => (
                <li key={z.id} className="px-5 py-3 flex items-center justify-between text-caption">
                  <div>
                    <p className="text-navy font-medium">CHF {(z.amount_gross / 100).toFixed(2)}</p>
                    <p className="text-quiet font-mono">{new Date(z.created_at).toLocaleDateString('de-CH')}</p>
                  </div>
                  {z.pdf_url ? (
                    <a
                      href={z.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-caption text-navy hover:text-bronze inline-flex items-center gap-1"
                    >
                      PDF <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
                    </a>
                  ) : (
                    <span className="text-quiet">—</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

function PlanCompareCard({
  title, price, interval, current, highlighted, features,
}: {
  title: string;
  price: string;
  interval: string;
  current: boolean;
  highlighted?: boolean;
  features: { text: string; has: boolean }[];
}) {
  return (
    <div className={cn(
      'bg-paper rounded-card p-6 flex flex-col',
      highlighted ? 'border-2 border-bronze shadow-card' : 'border border-stone',
    )}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-serif text-head-md text-navy font-normal">
          {title}<span className="text-bronze">.</span>
        </h3>
        {current && (
          <span className="text-caption font-medium px-2.5 py-1 rounded-pill bg-success/10 text-success">
            Aktiv
          </span>
        )}
      </div>
      <div className="mb-5">
        <span className="font-serif text-head-lg text-navy">{price}</span>
        <span className="text-caption text-quiet ml-2">{interval}</span>
      </div>
      <ul className="space-y-2 text-body-sm flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2">
            {f.has ? (
              <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" strokeWidth={2} />
            ) : (
              <X className="w-4 h-4 text-quiet flex-shrink-0 mt-0.5" strokeWidth={1.5} />
            )}
            <span className={cn(f.has ? 'text-ink' : 'text-quiet line-through')}>{f.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ROIStat({
  icon: Icon, value, label,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-soft bg-bronze/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-bronze" strokeWidth={1.5} />
      </div>
      <div>
        <p className="font-serif text-2xl text-navy font-light leading-tight">{value}</p>
        <p className="text-caption text-quiet mt-0.5">{label}</p>
      </div>
    </div>
  );
}
