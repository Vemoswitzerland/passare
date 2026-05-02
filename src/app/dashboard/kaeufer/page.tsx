import Link from 'next/link';
import {
  ArrowRight, MessageSquare, FileLock2, Bell, Calendar,
  TrendingUp, Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { hasTable } from '@/lib/db/has-table';
import type { Suchprofil } from '@/lib/match-score';
import { getDailyDigest, getListings } from '@/lib/listings';
import { ListingCardMini } from '@/components/kaeufer/listing-card-mini';
import { MaxUpsellBanner } from '@/components/kaeufer/upsell-banner';
import { MarketplaceEmpty } from '@/components/marketplace/MarketplaceEmpty';

type Props = { searchParams: Promise<{ welcome?: string }> };

export default async function KaeuferDashboardPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;

  const { welcome } = await searchParams;

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, subscription_tier, created_at')
    .eq('id', u.user.id)
    .maybeSingle();

  const isPlus = profile?.subscription_tier === 'plus';

  // Erstes Suchprofil laden (für Daily Digest Match-Score-Badge in der Card)
  let suchprofil: Suchprofil | null = null;
  let suchprofilName = '';
  if (await hasTable('suchprofile')) {
    const { data } = await supabase
      .from('suchprofile')
      .select('id, name, branche, kantone, umsatz_min, umsatz_max, ebitda_min')
      .eq('kaeufer_id', u.user.id)
      .eq('ist_pausiert', false)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (data) {
      suchprofil = {
        branche: data.branche ?? [],
        kantone: data.kantone ?? [],
        umsatz_min: data.umsatz_min,
        umsatz_max: data.umsatz_max,
        ebitda_min: data.ebitda_min,
      };
      suchprofilName = data.name;
    }
  }

  // Daily-Digest aus DB laden (helper kümmert sich um Suchprofil-Matching + Fallback)
  const topMatches = await getDailyDigest(u.user.id, 3);

  // "Mehr aus dem Marktplatz" — die nächsten 3 nach den Daily-Digest-Treffern
  const moreListingsRaw = await getListings({ sort: 'neu', limit: 6 });
  const topIds = new Set(topMatches.map((t) => t.id));
  const moreListings = moreListingsRaw.filter((l) => !topIds.has(l.id)).slice(0, 3);

  // Tage seit Registrierung
  const daysSinceRegister = profile?.created_at
    ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const firstName = profile?.full_name?.split(' ')[0] ?? '';

  return (
    <div className="space-y-8 max-w-content">
      {/* Welcome Banner */}
      {welcome && (
        <div className="bg-gradient-to-br from-navy to-ink text-cream rounded-card p-7 md:p-9">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-bronze" strokeWidth={1.5} />
            <p className="overline text-bronze">
              {welcome === 'plus' ? 'Käufer+ aktiv' : 'Willkommen'}
            </p>
          </div>
          <h1 className="font-serif text-display-sm md:text-head-lg text-cream font-light leading-tight mb-3">
            Willkommen, {firstName || 'Investor'}<span className="text-bronze">.</span>
          </h1>
          <p className="text-body text-cream/80 max-w-xl mb-5 leading-relaxed">
            {welcome === 'plus'
              ? 'Käufer+ ist freigeschaltet. Du siehst neue Inserate ab jetzt 7 Tage vor allen anderen — der nächste Daily Digest kommt morgen um 7:00 Uhr.'
              : 'Dein Suchprofil ist aktiv. Wir scannen den Marktplatz für dich und schicken dir den Daily Digest jeden Morgen um 7:00 Uhr.'}
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            <Link
              href="/kaufen"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-bronze text-cream rounded-soft text-body-sm font-medium hover:bg-bronze-ink transition-colors"
            >
              Marktplatz öffnen <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </Link>
            <Link
              href="/dashboard/kaeufer/profil"
              className="font-mono text-caption uppercase tracking-widest text-cream/70 hover:text-bronze"
            >
              Profil ergänzen
            </Link>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <p className="overline text-bronze mb-2">Käufer-Dashboard</p>
        <h1 className="font-serif text-display-sm md:text-head-lg text-navy font-light">
          {welcome ? 'Dein Stand heute' : `Hi ${firstName || 'da'}`}<span className="text-bronze">.</span>
        </h1>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={MessageSquare} label="Offene Anfragen" value="0" trend="+0" href="/dashboard/kaeufer/anfragen" />
        <StatCard icon={FileLock2} label="Aktive NDAs" value="0" trend="+0" href="/dashboard/kaeufer/ndas" />
        <StatCard icon={Bell} label="Heute neue Treffer" value={String(topMatches.length)} trend="Daily Digest" href="/kaufen" />
        <StatCard icon={Calendar} label="Tage seit Start" value={String(daysSinceRegister || 1)} trend={daysSinceRegister < 7 ? 'Neu' : 'Aktiv'} />
      </div>

      {/* Daily Digest */}
      <section>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone flex-wrap gap-3">
          <div>
            <p className="overline text-bronze-ink mb-1">Daily Digest · {new Date().toLocaleDateString('de-CH', { day: '2-digit', month: 'long' })}</p>
            <h2 className="font-serif text-head-md text-navy font-normal">
              Heute für dich<span className="text-bronze">.</span>
            </h2>
          </div>
          {suchprofilName && (
            <Link
              href="/dashboard/kaeufer/suchprofile"
              className="font-mono text-caption uppercase tracking-widest text-quiet hover:text-navy inline-flex items-center gap-1"
            >
              Profil: «{suchprofilName}»
              <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
            </Link>
          )}
        </div>

        {topMatches.length === 0 ? (
          <MarketplaceEmpty variant="kaeufer-digest" />
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {topMatches.map((listing) => (
              <ListingCardMini
                key={listing.id}
                listing={listing}
                suchprofil={suchprofil ?? undefined}
                detailHref={`/kaufen/${listing.slug ?? listing.id}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* MAX Upsell (nur wenn Basic) */}
      {!isPlus && (
        <MaxUpsellBanner
          variant="card"
          reason="Mit deinem Profil siehst du täglich 3 neue Treffer — mit Käufer+ 7 Tage vor allen anderen, dazu Echtzeit-E-Mail-Alerts bei jedem Match."
        />
      )}

      {/* Aktivitäts-Recap */}
      <section className="bg-paper border border-stone rounded-card p-6 md:p-7">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-bronze" strokeWidth={1.5} />
          <h3 className="font-serif text-head-sm text-navy font-normal">Diese Woche auf passare</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <RecapStat label="Inserate angeschaut" value="0" />
          <RecapStat label="Anfragen gesendet" value="0" />
          <RecapStat label="NDAs unterzeichnet" value="0" />
          <RecapStat label="Datenraum-Zugriffe" value="0" />
        </div>
        <p className="text-caption text-quiet mt-4 leading-relaxed">
          Sobald du den Marktplatz nutzt, siehst du hier deinen Wochen-Verlauf.
        </p>
      </section>

      {/* Empfehlungen */}
      {moreListings.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone">
            <h2 className="font-serif text-head-md text-navy font-normal">
              Mehr aus dem Marktplatz<span className="text-bronze">.</span>
            </h2>
            <Link
              href="/kaufen"
              className="font-mono text-caption uppercase tracking-widest text-quiet hover:text-navy inline-flex items-center gap-1"
            >
              Alle ansehen <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {moreListings.map((l) => (
              <ListingCardMini
                key={l.id}
                listing={l}
                suchprofil={suchprofil ?? undefined}
                detailHref={`/kaufen/${l.slug ?? l.id}`}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, trend, href,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  trend: string;
  href?: string;
}) {
  const inner = (
    <div className="bg-paper border border-stone rounded-card p-5 hover:border-bronze/40 transition-colors h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-soft bg-stone/50 flex items-center justify-center">
          <Icon className="w-[18px] h-[18px] text-navy" strokeWidth={1.5} />
        </div>
        <span className="font-mono text-caption text-quiet">{trend}</span>
      </div>
      <p className="font-serif text-3xl text-navy font-light leading-none mb-1">{value}</p>
      <p className="text-caption text-quiet uppercase tracking-wider">{label}</p>
    </div>
  );
  if (href) return <Link href={href} className="block">{inner}</Link>;
  return inner;
}

function RecapStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-2xl text-navy font-light tabular-nums">{value}</p>
      <p className="text-caption text-quiet uppercase tracking-wider mt-1">{label}</p>
    </div>
  );
}
