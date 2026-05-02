import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight, Check, X, Crown, ShieldCheck, Zap, MessageSquare, Bell, FileLock2,
} from 'lucide-react';
import { Container } from '@/components/ui/container';
import { createClient } from '@/lib/supabase/server';
import { continueWithBasicAction } from './actions';
import { hasTable } from '@/lib/db/has-table';
import { countListings } from '@/lib/listings';
import { cn } from '@/lib/utils';

export const metadata = {
  title: 'Paket wählen — passare',
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ canceled?: string; interval?: 'monthly' | 'yearly' }>;
};

export default async function PaketPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) redirect('/auth/login?next=/onboarding/kaeufer/paket');

  const { data: profile } = await supabase
    .from('profiles')
    .select('rolle, full_name, onboarding_completed_at, subscription_tier')
    .eq('id', u.user.id)
    .maybeSingle();

  if (profile?.rolle !== 'kaeufer') redirect('/onboarding/kaeufer/tunnel');

  // Käufer-Profil laden für personalisiertes Banner + Treffer-Count
  const profilTableExists = await hasTable('kaeufer_profil');
  let kaeuferProfil: {
    investor_typ?: string | null;
    budget_max?: number | null;
    branche_praeferenzen?: string[] | null;
    regionen?: string[] | null;
  } | null = null;
  if (profilTableExists) {
    const { data } = await supabase
      .from('kaeufer_profil')
      .select('investor_typ, budget_max, branche_praeferenzen, regionen')
      .eq('user_id', u.user.id)
      .maybeSingle();
    kaeuferProfil = data;
  }

  // Treffer-Count: wieviele live-Inserate passen grob zum Profil?
  // V1-Approach: Filter auf erste Branche/Region des Profils via DB.
  // Volle matchScore-Logik kommt zurück, sobald sie auf InseratPublic läuft.
  const trefferCount = await (async () => {
    if (!kaeuferProfil) return countListings();
    const branche = kaeuferProfil.branche_praeferenzen?.[0];
    const region = kaeuferProfil.regionen?.[0];
    return countListings({
      branche: branche ?? undefined,
      kanton: region && region !== 'CH' ? region : undefined,
    });
  })();

  const isHighValue =
    kaeuferProfil?.investor_typ === 'family_office' ||
    kaeuferProfil?.investor_typ === 'holding_strategisch' ||
    (kaeuferProfil?.budget_max ?? 0) >= 5_000_000;

  const sp = await searchParams;
  // Default: jährlich (zwei Monate gratis). Toggle erlaubt Wechsel.
  const interval = sp.interval === 'monthly' ? 'monthly' : 'yearly';

  return (
    <main className="min-h-screen bg-cream">
      <header className="border-b border-stone bg-cream/85 backdrop-blur-md sticky top-0 z-30">
        <Container>
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="font-serif text-2xl text-navy tracking-tight">
              passare<span className="text-bronze">.</span>
            </Link>
            <span className="font-mono text-caption text-quiet uppercase tracking-widest hidden sm:inline">
              Paket wählen
            </span>
          </div>
        </Container>
      </header>

      <section className="py-10 md:py-14">
        <Container>
          {sp.canceled === '1' && (
            <div className="max-w-2xl mx-auto mb-8 bg-warn/5 border border-warn/20 rounded-soft px-4 py-3 text-body-sm text-warn">
              Stripe-Bezahlung abgebrochen — du kannst trotzdem mit Basic gratis weitermachen.
            </div>
          )}

          <div className="text-center mb-10 md:mb-14">
            <p className="overline text-bronze mb-3">Profil ist fertig</p>
            <h1 className="font-serif-display text-display-sm md:text-display-md text-navy font-light leading-tight">
              Wir haben{' '}
              <span className="text-bronze">{trefferCount}</span>{' '}
              passende Inserate<span className="text-bronze">.</span>
            </h1>
            <p className="text-body text-muted mt-4 max-w-xl mx-auto leading-relaxed">
              Mit welchem Paket willst du starten? Du kannst jederzeit wechseln.
            </p>
          </div>

          {/* Personalisiertes Banner für High-Value-Profile */}
          {isHighValue && (
            <div className="max-w-3xl mx-auto mb-8 bg-bronze/5 border border-bronze/30 rounded-card p-5 flex items-start gap-4">
              <Crown className="w-5 h-5 text-bronze flex-shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <p className="text-navy font-medium text-body-sm mb-1">
                  Bei deinem Profil empfehlen wir Käufer+.
                </p>
                <p className="text-caption text-muted leading-relaxed">
                  Family Offices und strategische Käufer schließen Deals oft in den ersten 7 Tagen ab — genau da, wo Käufer+ dir Frühzugang gibt. Ohne Käufer+ siehst du Top-Inserate eine Woche zu spät.
                </p>
              </div>
            </div>
          )}

          {/* Intervall-Toggle */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center bg-paper border border-stone rounded-pill p-1">
              <Link
                href="/onboarding/kaeufer/paket?interval=monthly"
                className={cn(
                  'px-5 py-2 rounded-pill text-caption font-medium transition-colors',
                  interval === 'monthly' ? 'bg-navy text-cream' : 'text-muted hover:text-navy',
                )}
              >
                Monatlich
              </Link>
              <Link
                href="/onboarding/kaeufer/paket?interval=yearly"
                className={cn(
                  'px-5 py-2 rounded-pill text-caption font-medium transition-colors flex items-center gap-2',
                  interval === 'yearly' ? 'bg-navy text-cream' : 'text-muted hover:text-navy',
                )}
              >
                Jährlich
                <span className="font-mono text-[10px] uppercase tracking-widest text-bronze">
                  −2 Monate
                </span>
              </Link>
            </div>
          </div>

          {/* 2 Karten */}
          <div className="grid lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* ─── BASIC ─── */}
            <div className="bg-paper border border-stone rounded-card p-7 md:p-9 flex flex-col">
              <div className="flex items-baseline gap-3 mb-2">
                <h2 className="font-serif text-head-lg text-navy font-normal">Käufer Basic</h2>
                <span className="font-mono text-caption text-quiet">unbefristet</span>
              </div>
              <p className="text-body-sm text-muted mb-6">
                Der entspannte Einstieg.
              </p>

              <div className="mb-6">
                <span className="font-serif text-display-sm text-navy font-light">CHF 0</span>
                <span className="text-body-sm text-quiet ml-2">/ pro Monat</span>
              </div>

              <ul className="space-y-2.5 text-body-sm mb-8">
                <FeatureRow text="Öffentliche Inserate ansehen" />
                <FeatureRow text="Alle 18 Filter" />
                <FeatureRow text="Gespeicherte Suchen" />
                <FeatureRow text="Wöchentlicher E-Mail-Digest" />
                <FeatureRow text="Geschlossene Inserate" available={false} />
                <FeatureRow text="7 Tage Frühzugang" available={false} />
                <FeatureRow text="Echtzeit-E-Mail-Alerts" available={false} />
                <FeatureRow text="Eigenes Logo im Käuferprofil" available={false} />
              </ul>

              <form action={continueWithBasicAction} className="mt-auto">
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 border border-navy/15 text-navy rounded-soft text-body-sm font-medium hover:border-navy hover:-translate-y-[1px] transition-all"
                >
                  Gratis weitermachen
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </form>
            </div>

            {/* ─── Käufer+ ─── */}
            <div className="bg-paper border-2 border-bronze rounded-card p-7 md:p-9 flex flex-col shadow-card relative overflow-hidden">
              <span className="absolute top-0 right-0 bg-bronze text-cream font-mono text-[11px] uppercase tracking-widest px-4 py-1.5 rounded-bl-card">
                {isHighValue ? 'Empfohlen für dich' : 'Empfohlen'}
              </span>

              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-4 h-4 text-bronze" strokeWidth={1.5} />
                <h2 className="font-serif text-head-lg text-navy font-normal">Käufer+</h2>
              </div>
              <p className="text-body-sm text-muted mb-6">
                Für ernsthafte Käufer, die nichts verpassen wollen.
              </p>

              <div className="mb-2">
                <span className="font-serif text-display-sm text-navy font-light">
                  CHF {interval === 'yearly' ? '166' : '199'}
                </span>
                <span className="text-body-sm text-quiet ml-2">/ pro Monat</span>
              </div>
              <p className="text-caption text-quiet mb-6">
                {interval === 'yearly'
                  ? 'CHF 1\'990 pro Jahr — 2 Monate gratis · zzgl. 8.1% MwSt.'
                  : 'CHF 199/Monat · zzgl. 8.1% MwSt.'}
              </p>

              <ul className="space-y-2.5 text-body-sm mb-6">
                <FeatureRow text="Öffentliche Inserate" />
                <FeatureRow text="Alle 18 Filter" />
                <FeatureRow text="Gespeicherte Suchen" />
                <FeatureRow text="Geschlossene Inserate sehen" highlight />
                <FeatureRow text="7 Tage Frühzugang auf neue Inserate" highlight />
                <FeatureRow text="Echtzeit-E-Mail-Alerts bei Match" highlight />
              </ul>

              {/* Stripe-Form */}
              <form action="/api/stripe/create-checkout-session" method="post" className="mt-auto">
                <input type="hidden" name="tier" value="plus" />
                <input type="hidden" name="interval" value={interval} />
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-bronze text-cream rounded-soft text-body-sm font-medium hover:bg-bronze-ink hover:-translate-y-[1px] hover:shadow-lift transition-all"
                >
                  Mit Käufer+ starten
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </button>
                <p className="text-caption text-quiet text-center mt-3">
                  Sichere Bezahlung · jederzeit kündbar
                </p>
              </form>
            </div>
          </div>

          {/* Feature-Visuals */}
          <div className="max-w-4xl mx-auto mt-12 grid sm:grid-cols-3 gap-4">
            <FeatureVisual icon={Zap} title="Frühzugang" desc="7 Tage vor allen anderen" />
            <FeatureVisual icon={Bell} title="Echtzeit-Alerts" desc="E-Mail bei jedem Match" />
            <FeatureVisual icon={ShieldCheck} title="Geschlossene Inserate" desc="Exklusiver Zugang" />
          </div>

          <p className="text-center text-caption text-quiet mt-12">
            Du kannst Käufer+ jederzeit pausieren oder kündigen. Dein Käufer-Profil bleibt aktiv.
          </p>
        </Container>
      </section>
    </main>
  );
}

function FeatureRow({
  text, available = true, highlight = false,
}: { text: string; available?: boolean; highlight?: boolean }) {
  return (
    <li className="flex items-start gap-2.5">
      {available ? (
        <Check
          className={cn('w-4 h-4 flex-shrink-0 mt-0.5', highlight ? 'text-bronze' : 'text-success')}
          strokeWidth={2}
        />
      ) : (
        <X className="w-4 h-4 flex-shrink-0 mt-0.5 text-quiet" strokeWidth={1.5} />
      )}
      <span className={cn(
        available ? (highlight ? 'text-navy font-medium' : 'text-ink') : 'text-quiet line-through',
      )}>
        {text}
      </span>
    </li>
  );
}

function FeatureVisual({
  icon: Icon, title, desc,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="text-center p-4 bg-paper border border-stone rounded-soft">
      <Icon className="w-5 h-5 text-bronze mx-auto mb-2" strokeWidth={1.5} />
      <p className="text-caption text-navy font-medium">{title}</p>
      <p className="text-caption text-quiet mt-1 leading-snug">{desc}</p>
    </div>
  );
}

// Stripe-Submit, falls Stripe nicht konfiguriert: API-Route gibt 503 zurück, Browser zeigt Standard-Fehler.
// In Production: ENV-Vars STRIPE_SECRET_KEY, STRIPE_PRICE_MAX_MONTHLY, STRIPE_PRICE_MAX_YEARLY müssen gesetzt sein.
export const dynamic = 'force-dynamic';
