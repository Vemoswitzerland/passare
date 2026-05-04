import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getBranchen } from '@/lib/branchen';
import { SuchprofilForm, type SuchprofilInitial } from '../../neu/SuchprofilForm';
import { isPlusKaeufer } from '@/lib/kaeufer/is-plus';

export const metadata = { title: 'Suchprofil bearbeiten — passare', robots: { index: false, follow: false } };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditSuchprofilPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) redirect('/auth/login?next=/dashboard/kaeufer/suchprofile');

  const { data: prof } = await supabase
    .from('profiles')
    .select('subscription_tier, is_broker')
    .eq('id', u.user.id)
    .maybeSingle();
  const isPlus = isPlusKaeufer(prof);

  const { data: profil } = await supabase
    .from('suchprofile')
    .select('id, name, branche, kantone, umsatz_min, umsatz_max, ebitda_min, ma_min, ma_max, email_alert')
    .eq('id', id)
    .eq('kaeufer_id', u.user.id)
    .maybeSingle();

  if (!profil) notFound();

  const initial: SuchprofilInitial = {
    id: profil.id,
    name: profil.name,
    branche: profil.branche ?? [],
    kantone: profil.kantone ?? [],
    umsatz_min: profil.umsatz_min,
    umsatz_max: profil.umsatz_max,
    ebitda_min: profil.ebitda_min,
    ma_min: profil.ma_min,
    ma_max: profil.ma_max,
    email_alert: profil.email_alert ?? true,
  };

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
        <p className="overline text-bronze mb-2">Suchprofil bearbeiten</p>
        <h1 className="font-serif text-display-sm md:text-head-lg text-navy font-light">
          {profil.name}<span className="text-bronze">.</span>
        </h1>
        <p className="text-body-sm text-muted mt-2 max-w-xl">
          Pass deine Such-Kriterien an — die Alerts werden ab sofort nach den neuen Kriterien gefiltert.
        </p>
      </div>

      <SuchprofilForm isMax={isPlus} branchen={branchen} initial={initial} />
    </div>
  );
}
