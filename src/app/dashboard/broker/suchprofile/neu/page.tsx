import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getBranchen } from '@/lib/branchen';
import { SuchprofilForm } from '../../../kaeufer/suchprofile/neu/SuchprofilForm';

export const metadata = { title: 'Neues Suchprofil — passare Broker', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function BrokerNewSuchprofilPage() {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;

  const branchen = await getBranchen();

  return (
    <div className="px-6 md:px-10 py-8 md:py-12">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          href="/dashboard/broker/suchprofile"
          className="inline-flex items-center gap-2 font-mono text-caption uppercase tracking-widest text-quiet hover:text-navy"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
          Zurück zur Übersicht
        </Link>

        <div>
          <p className="overline text-bronze-ink mb-2">Neues Suchprofil</p>
          <h1 className="font-serif text-display-sm text-navy font-light tracking-tight">
            Beschreib was deine Käufer suchen
          </h1>
          <p className="text-body-sm text-muted mt-2 max-w-xl">
            Pro Profil bekommst du einen eigenen Daily Digest. Ideal um z. B. eine «Maschinenbau ZH/AG»- und eine «Treuhand Westschweiz»-Strategie zu trennen.
          </p>
        </div>

        <SuchprofilForm
          isMax={true}
          branchen={branchen}
          successUrl="/dashboard/broker/suchprofile"
        />
      </div>
    </div>
  );
}
