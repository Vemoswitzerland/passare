import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { InseratWizard } from '../../components/InseratWizard';

export const metadata = { title: 'Inserat bearbeiten — passare' };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; step?: string }>;
};

export default async function EditInseratPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) notFound();

  const { data: row } = await supabase
    .from('inserate')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!row) notFound();
  if (row.verkaeufer_id !== userData.user.id) notFound();

  // DB-Spaltennamen → Wizard-Type (Frontend nutzt branche_id/jahr/uebergabe_grund,
  // DB hat branche/gruendungsjahr/grund)
  const inserat = {
    id: row.id,
    status: row.status,
    zefix_uid: row.zefix_uid ?? null,
    firma_name: row.firma_name ?? null,
    firma_rechtsform: row.firma_rechtsform ?? null,
    titel: row.titel,
    teaser: row.teaser ?? null,
    beschreibung: row.beschreibung ?? null,
    branche_id: row.branche ?? null,
    kanton: row.kanton,
    jahr: row.gruendungsjahr,
    mitarbeitende: row.mitarbeitende,
    umsatz_chf: row.umsatz_chf,
    ebitda_chf: row.ebitda_chf,
    kaufpreis_chf: row.kaufpreis_chf,
    kaufpreis_vhb: row.kaufpreis_vhb ?? false,
    kaufpreis_min_chf: row.kaufpreis_min_chf,
    kaufpreis_max_chf: row.kaufpreis_max_chf,
    eigenkapital_chf: row.eigenkapital_chf,
    uebergabe_grund: row.grund,
    uebergabe_zeitpunkt: row.uebergabe_zeitpunkt ?? null,
    art: row.art ?? 'angebot',
    kategorie: row.kategorie ?? 'm_a',
    immobilien: row.immobilien,
    finanzierung: row.finanzierung,
    wir_anteil_moeglich: row.wir_anteil_moeglich ?? false,
    rechtsform_typ: row.rechtsform_typ,
    cover_url: row.cover_url ?? null,
    cover_source: row.cover_source ?? null,
    sales_points: row.sales_points ?? [],
    website_url: row.website_url ?? null,
    linkedin_url: row.linkedin_url ?? null,
    paket: row.paket,
    paid_at: row.paid_at ?? null,
  };

  const initialStep = sp.step ? Number(sp.step) : sp.from === 'pre-reg' ? 2 : 1;

  return (
    <div className="px-6 md:px-10 py-8 md:py-12">
      <div className="max-w-3xl mx-auto">
        <InseratWizard inserat={inserat} initialStep={initialStep} fromPreReg={sp.from === 'pre-reg'} />
      </div>
    </div>
  );
}
