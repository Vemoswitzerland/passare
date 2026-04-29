import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { InseratWizard } from '../../components/InseratWizard';
import { applySmartDefaults } from '@/lib/inserat-smart-defaults';

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

  // ── SMART DEFAULTS ──────────────────────────────────────────────
  // Wenn der User aus dem Pre-Reg-Funnel kommt und Felder noch leer
  // sind, schlagen wir aus Branche/Kanton/Eckdaten/Bewertung intelligente
  // Vorschläge vor — Titel, Teaser, Beschreibung, Sales-Points, Kaufpreis
  // werden ausgefüllt und in der DB persistiert. User kann jederzeit
  // editieren oder überschreiben.
  const ctx = {
    branche: row.branche,
    kanton: row.kanton,
    gruendungsjahr: row.gruendungsjahr,
    mitarbeitende: row.mitarbeitende,
    umsatz: row.umsatz_chf ? Number(row.umsatz_chf) : null,
    ebitda: row.ebitda_chf ? Number(row.ebitda_chf) : null,
    estimated_value_mid: row.estimated_value_mid ? Number(row.estimated_value_mid) : null,
    firma_rechtsform: row.firma_rechtsform,
    // Seed für deterministische Variation der Smart-Templates
    seed: row.id,
  };

  const smartPatch = applySmartDefaults(
    {
      titel: row.titel,
      teaser: row.teaser,
      beschreibung: row.beschreibung,
      sales_points: row.sales_points,
      kaufpreis_chf: row.kaufpreis_chf,
      kaufpreis_min_chf: row.kaufpreis_min_chf,
      uebergabe_grund: row.grund,
      uebergabe_zeitpunkt: row.uebergabe_zeitpunkt,
      finanzierung: row.finanzierung,
      immobilien: row.immobilien,
    },
    ctx,
  );

  // Patch in DB persistieren (mit echten Spaltennamen)
  if (Object.keys(smartPatch).length > 0) {
    const dbPatch: Record<string, any> = {};
    if ('titel' in smartPatch) dbPatch.titel = smartPatch.titel;
    if ('teaser' in smartPatch) dbPatch.teaser = smartPatch.teaser;
    if ('beschreibung' in smartPatch) dbPatch.beschreibung = smartPatch.beschreibung;
    if ('sales_points' in smartPatch) dbPatch.sales_points = smartPatch.sales_points;
    if ('kaufpreis_chf' in smartPatch) dbPatch.kaufpreis_chf = smartPatch.kaufpreis_chf;
    if ('uebergabe_grund' in smartPatch) dbPatch.grund = smartPatch.uebergabe_grund;
    if ('uebergabe_zeitpunkt' in smartPatch) dbPatch.uebergabe_zeitpunkt = smartPatch.uebergabe_zeitpunkt;
    if ('finanzierung' in smartPatch) dbPatch.finanzierung = smartPatch.finanzierung;
    if ('immobilien' in smartPatch) dbPatch.immobilien = smartPatch.immobilien;

    try {
      await supabase.from('inserate').update(dbPatch).eq('id', row.id);
      Object.assign(row, dbPatch);
      // Spaltennamen-Mapping: 'grund' in row → uebergabe_grund im UI
      if (dbPatch.grund) row.grund = dbPatch.grund;
    } catch (e) {
      console.warn('[smart-defaults] update failed:', e);
    }
  }

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
    anonymitaet_level: row.anonymitaet_level ?? 'voll_anonym',
    whatsapp_enabled: row.whatsapp_enabled ?? false,
    live_chat_enabled: row.live_chat_enabled ?? false,
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
