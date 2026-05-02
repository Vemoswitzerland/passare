import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getBranchen } from '@/lib/branchen';
import { SuchprofilForm } from './SuchprofilForm';

export const metadata = { title: 'Neues Suchprofil — passare', robots: { index: false, follow: false } };

export default async function NewSuchprofilPage() {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;

  const { data: prof } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', u.user.id)
    .maybeSingle();
  const isPlus = prof?.subscription_tier === 'plus';
  const branchen = await getBranchen();

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
          Pro Profil bekommst du einen eigenen Daily Digest. Nutze es um z.B. eine «Maschinenbau ZH/AG»- und eine «Treuhand Westschweiz»-Strategie zu trennen.
        </p>
      </div>

      <SuchprofilForm isMax={isPlus} branchen={branchen} />
    </div>
  );
}
