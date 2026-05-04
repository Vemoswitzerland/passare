import Link from 'next/link';
import { ArrowLeft, Crown } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getBranchen } from '@/lib/branchen';
import { SuchprofilForm } from './SuchprofilForm';
import { isPlusKaeufer } from '@/lib/kaeufer/is-plus';
import { hasTable } from '@/lib/db/has-table';

export const metadata = { title: 'Neues Suchprofil — passare', robots: { index: false, follow: false } };

export default async function NewSuchprofilPage() {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;

  const { data: prof } = await supabase
    .from('profiles')
    .select('subscription_tier, is_broker')
    .eq('id', u.user.id)
    .maybeSingle();
  const isPlus = isPlusKaeufer(prof);
  const branchen = await getBranchen();

  // Limit-Check: Basic darf nur 1 Suchprofil. Sonst Upsell-Page statt Form.
  let basicLimitReached = false;
  if (!isPlus && (await hasTable('suchprofile'))) {
    const { count } = await supabase
      .from('suchprofile')
      .select('*', { count: 'exact', head: true })
      .eq('kaeufer_id', u.user.id);
    basicLimitReached = (count ?? 0) >= 1;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Link
        href="/dashboard/kaeufer/suchprofile"
        className="inline-flex items-center gap-2 font-mono text-caption uppercase tracking-widest text-quiet hover:text-navy"
      >
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
        Zurück zur Übersicht
      </Link>

      <div>
        <p className="overline text-bronze mb-2">Neues Suchprofil</p>
        <h1 className="font-serif text-display-sm md:text-head-lg text-navy font-light">
          Beschreib was du suchst<span className="text-bronze">.</span>
        </h1>
        <p className="text-body-sm text-muted mt-2 max-w-xl">
          Pro Profil bekommst du einen eigenen E-Mail-Alert. Nutze es um z.B. eine «Maschinenbau ZH/AG»- und eine «Treuhand Westschweiz»-Strategie zu trennen.
        </p>
      </div>

      {basicLimitReached ? (
        <div className="bg-paper border-2 border-bronze/30 rounded-card p-7 md:p-9 shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-bronze/10 flex items-center justify-center">
              <Crown className="w-5 h-5 text-bronze" strokeWidth={1.5} />
            </div>
            <div>
              <p className="overline text-bronze">Käufer+ Benefit</p>
              <h2 className="font-serif text-head-md text-navy font-normal">Mehrere Suchprofile mit Käufer+</h2>
            </div>
          </div>
          <p className="text-body-sm text-muted mb-5 leading-relaxed">
            Mit Basic kannst du 1 Suchprofil anlegen — du hast es bereits genutzt. Käufer+ erlaubt unbegrenzt viele Suchprofile, damit du parallel verschiedene Strategien laufen lassen kannst (z.B. «Maschinenbau ZH» und «Treuhand Westschweiz»).
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            <Link
              href="/dashboard/kaeufer/abo"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-bronze text-cream rounded-soft text-body-sm font-medium hover:bg-bronze-ink transition-colors"
            >
              <Crown className="w-4 h-4" strokeWidth={1.5} />
              Auf Käufer+ upgraden
            </Link>
            <Link
              href="/dashboard/kaeufer/suchprofile"
              className="font-mono text-caption uppercase tracking-widest text-quiet hover:text-navy"
            >
              Bestehendes Profil bearbeiten →
            </Link>
          </div>
        </div>
      ) : (
        <SuchprofilForm isMax={isPlus} branchen={branchen} />
      )}
    </div>
  );
}
