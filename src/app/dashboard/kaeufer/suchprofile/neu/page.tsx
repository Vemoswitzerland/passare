import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { hasTable } from '@/lib/db/has-table';
import { getBranchen } from '@/lib/branchen';
import { SuchprofilForm } from './SuchprofilForm';

export const metadata = { title: 'Neues Suchprofil — passare', robots: { index: false, follow: false } };

export default async function NewSuchprofilPage() {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;

  // Limit-Check: schon 3 Profile?
  if (await hasTable('suchprofile')) {
    const { count } = await supabase
      .from('suchprofile')
      .select('*', { count: 'exact', head: true })
      .eq('kaeufer_id', u.user.id);
    if ((count ?? 0) >= 3) redirect('/dashboard/kaeufer/suchprofile?error=limit');
  }

  const { data: prof } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', u.user.id)
    .maybeSingle();
  const isMax = prof?.subscription_tier === 'max';
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

      <SuchprofilForm isMax={isMax} branchen={branchen} />
    </div>
  );
}
