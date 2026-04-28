'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft, Check, Loader2, AlertTriangle, Image as ImageIcon, Upload as UploadIcon, Sparkles, Trash2, Plus } from 'lucide-react';
import { saveStep, mockPaketKaufen, submitForReview } from '../actions';
import { BRANCHEN_LIST } from '@/data/branchen-multiples';
import { STOCKFOTOS_BY_BRANCHE } from '@/data/branchen-stockfotos';
import { cn } from '@/lib/utils';

// Mapping branche_id (Backend) → Stockfoto-Branche-Name (Display)
const BRANCHE_TO_STOCKFOTO_KEY: Record<string, string> = {
  software_saas: 'IT & Technologie',
  it_services: 'IT & Technologie',
  healthcare: 'Gesundheit',
  maschinenbau: 'Maschinenbau',
  bau_handwerk: 'Bauwesen',
  beratung_treuhand: 'Beratung',
  industrie_chemie: 'Handel / Industrie',
  elektrotechnik: 'Handel / Industrie',
  lebensmittel: 'Lebensmittel',
  telco_utilities: 'Energie / Umwelt',
  automotive: 'Autoindustrie',
  handel_ecommerce: 'Kleinhandel',
  medien_verlage: 'Grafik / Design',
  logistik_transport: 'Logistik',
  textil: 'Andere Dienstleistungen',
  gastro_hotel: 'Gastgewerbe',
  immobilien: 'Immobilien',
  andere: 'Andere Dienstleistungen',
};

const FALLBACK_STOCKFOTOS = [
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=70&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&q=70&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&q=70&auto=format&fit=crop',
];

const KANTONE: Array<[string, string]> = [
  ['ZH', 'Zürich'], ['BE', 'Bern'], ['LU', 'Luzern'], ['UR', 'Uri'], ['SZ', 'Schwyz'],
  ['OW', 'Obwalden'], ['NW', 'Nidwalden'], ['GL', 'Glarus'], ['ZG', 'Zug'], ['FR', 'Fribourg'],
  ['SO', 'Solothurn'], ['BS', 'Basel-Stadt'], ['BL', 'Basel-Landschaft'], ['SH', 'Schaffhausen'],
  ['AR', 'Appenzell A.Rh.'], ['AI', 'Appenzell I.Rh.'], ['SG', 'St. Gallen'],
  ['GR', 'Graubünden'], ['AG', 'Aargau'], ['TG', 'Thurgau'], ['TI', 'Ticino'],
  ['VD', 'Vaud'], ['VS', 'Valais'], ['NE', 'Neuchâtel'], ['GE', 'Genève'], ['JU', 'Jura'],
];

const UEBERGABE_GRUENDE: Array<[string, string]> = [
  ['altersnachfolge', 'Altersnachfolge'],
  ['strategischer_exit', 'Strategischer Exit'],
  ['pensionierung', 'Pensionierung'],
  ['gesundheit', 'Gesundheit'],
  ['familienwechsel', 'Familienwechsel'],
  ['andere', 'Andere'],
];

// Pakete + Powerups kommen aus src/data/pakete.ts (Single-Source)
import { PAKETE_LIST as NEW_PAKETE, POWERUPS as NEW_POWERUPS, recommendPaket, getCompanymarketDifference } from '@/data/pakete';

type Inserat = {
  id: string;
  status: string;
  // Firma (aus Pre-Reg)
  zefix_uid: string | null;
  firma_name: string | null;
  firma_rechtsform: string | null;
  // Inhalt
  titel: string | null;
  teaser: string | null;
  beschreibung: string | null;
  // Eckdaten — DB-Spalten heissen: branche (nicht branche_id), gruendungsjahr (nicht jahr), grund (nicht uebergabe_grund)
  branche_id: string | null;       // mapped zu Spalte 'branche'
  kanton: string | null;
  jahr: number | null;             // mapped zu Spalte 'gruendungsjahr'
  mitarbeitende: number | null;
  umsatz_chf: string | number | null;
  ebitda_chf: string | number | null;
  kaufpreis_chf: string | number | null;
  kaufpreis_vhb: boolean;
  kaufpreis_min_chf: string | number | null;
  kaufpreis_max_chf: string | number | null;
  eigenkapital_chf: string | number | null;
  uebergabe_grund: string | null;  // mapped zu Spalte 'grund'
  uebergabe_zeitpunkt: string | null;
  // Neu: Kategorisierung + Konditionen
  art: 'angebot' | 'gesuch' | null;
  kategorie: 'm_a' | 'kapital' | 'teilnahme' | 'franchise' | 'handelsvertretung' | 'shareit' | null;
  immobilien: 'keine' | 'eigentum' | 'miete' | 'auf_anfrage' | null;
  finanzierung: 'selbst' | 'abzahlung' | 'verhandlungsfaehig' | null;
  wir_anteil_moeglich: boolean;
  rechtsform_typ: string | null;
  // Bilder + Story
  cover_url: string | null;
  cover_source: string | null;
  sales_points: string[];
  // Soziale Links
  website_url: string | null;
  linkedin_url: string | null;
  // Paket
  paket: string | null;
  paid_at: string | null;
};

type Props = {
  inserat: Inserat;
  initialStep: number;
  fromPreReg: boolean;
};

export function InseratWizard({ inserat, initialStep, fromPreReg }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [step, setStep] = useState(Math.max(1, Math.min(5, initialStep)));
  const [data, setData] = useState<Inserat>(inserat);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback((patch: Partial<Inserat>) => {
    setData((d) => ({ ...d, ...patch }));
  }, []);

  // Auto-Save mit Debounce 1500ms (skip Step 1, das nur view ist)
  useEffect(() => {
    if (step < 2 || step > 4) return;
    const t = window.setTimeout(async () => {
      setSaving(true);
      setError(null);
      const payload = buildStepPayload(step, data);
      const res = await saveStep(inserat.id, step, payload);
      setSaving(false);
      if (!res.ok) setError(res.error);
    }, 1500);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, step]);

  const goNext = async () => {
    if (step >= 5) return;
    // Bei Step 4→5: Save first
    setSaving(true);
    const payload = buildStepPayload(step, data);
    await saveStep(inserat.id, step, payload);
    setSaving(false);
    setStep(step + 1);
  };
  const goPrev = () => setStep(Math.max(1, step - 1));

  const canNext = (() => {
    if (step === 1) return Boolean(data.firma_name || data.zefix_uid);
    if (step === 2)
      return Boolean(
        data.titel && data.titel.length >= 10 &&
        data.branche_id &&
        data.kanton &&
        data.jahr &&
        data.mitarbeitende &&
        data.umsatz_chf &&
        data.ebitda_chf !== null && data.ebitda_chf !== undefined,
      );
    if (step === 3) return Boolean(data.cover_url);
    if (step === 4) return data.sales_points.length > 0;
    return true;
  })();

  return (
    <div className="space-y-10">
      {fromPreReg && step === 2 && (
        <div className="rounded-card bg-bronze/5 border border-bronze/30 p-4">
          <p className="text-body-sm text-bronze-ink inline-flex items-center gap-2">
            <Sparkles className="w-4 h-4" strokeWidth={1.5} />
            Daten aus deinem Pre-Onboarding wurden übernommen — kontrolliere und ergänze.
          </p>
        </div>
      )}

      <ProgressBar step={step} />

      <div>
        {step === 1 && <Step1Zefix data={data} />}
        {step === 2 && <Step2Basis data={data} update={update} />}
        {step === 3 && <Step3Cover data={data} update={update} inseratId={inserat.id} />}
        {step === 4 && <Step4Strengths data={data} update={update} />}
        {step === 5 && (
          <Step5Paket
            data={data}
            update={update}
            inseratId={inserat.id}
            onPaid={() => {
              startTransition(() => router.refresh());
            }}
          />
        )}
      </div>

      {/* Save indicator */}
      <div className="flex items-center justify-center gap-2 text-caption">
        {saving ? (
          <>
            <Loader2 className="w-3.5 h-3.5 text-bronze animate-spin" strokeWidth={1.5} />
            <span className="text-quiet">Wird gespeichert …</span>
          </>
        ) : error ? (
          <>
            <AlertTriangle className="w-3.5 h-3.5 text-warn" strokeWidth={1.5} />
            <span className="text-warn">{error}</span>
          </>
        ) : (
          <>
            <Check className="w-3.5 h-3.5 text-success" strokeWidth={2} />
            <span className="text-quiet">Auto-gespeichert</span>
          </>
        )}
      </div>

      {/* Navigation */}
      {step < 5 && (
        <div className="flex items-center justify-between pt-4 border-t border-stone">
          <button
            type="button"
            onClick={goPrev}
            disabled={step === 1}
            className="inline-flex items-center gap-2 text-body-sm text-muted hover:text-navy disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            Zurück
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={!canNext}
            className={cn(
              'inline-flex items-center gap-2 px-6 py-3 rounded-soft text-body-sm font-medium transition-all',
              canNext
                ? 'bg-navy text-cream hover:bg-ink shadow-card hover:shadow-lift hover:-translate-y-px'
                : 'bg-stone text-quiet cursor-not-allowed',
            )}
          >
            Weiter
            <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  );
}

function buildStepPayload(step: number, d: Inserat): Record<string, unknown> {
  if (step === 2) {
    return {
      titel: d.titel,
      teaser: d.teaser,
      beschreibung: d.beschreibung,
      branche_id: d.branche_id,             // server mapped → 'branche'
      kanton: d.kanton,
      jahr: d.jahr?.toString(),             // server mapped → 'gruendungsjahr'
      mitarbeitende: d.mitarbeitende?.toString(),
      umsatz_chf: d.umsatz_chf?.toString(),
      ebitda_chf: d.ebitda_chf?.toString(),
      kaufpreis_chf: d.kaufpreis_chf?.toString(),
      kaufpreis_vhb: d.kaufpreis_vhb ? 'true' : 'false',
      kaufpreis_min_chf: d.kaufpreis_min_chf?.toString(),
      kaufpreis_max_chf: d.kaufpreis_max_chf?.toString(),
      eigenkapital_chf: d.eigenkapital_chf?.toString(),
      uebergabe_grund: d.uebergabe_grund,   // server mapped → 'grund'
      uebergabe_zeitpunkt: d.uebergabe_zeitpunkt,
      // Neue Felder (Kategorie/Art/Immobilien/Finanzierung/WIR)
      art: d.art ?? 'angebot',
      kategorie: d.kategorie ?? 'm_a',
      immobilien: d.immobilien,
      finanzierung: d.finanzierung,
      wir_anteil_moeglich: d.wir_anteil_moeglich ? 'true' : 'false',
      rechtsform_typ: d.rechtsform_typ,
    };
  }
  if (step === 3) {
    return { cover_url: d.cover_url, cover_source: d.cover_source };
  }
  if (step === 4) {
    return { sales_points: d.sales_points };
  }
  return {};
}

function maBucket(n: number | null | undefined): string | null {
  if (!n) return null;
  if (n < 10) return '0-10';
  if (n < 20) return '10-20';
  if (n < 50) return '20-50';
  if (n < 100) return '50-100';
  return '>100';
}

function umsatzBucket(n: number): string | null {
  if (!n) return null;
  if (n < 250000) return '0-250k';
  if (n < 500000) return '250-500k';
  if (n < 1000000) return '500k-1M';
  if (n < 5000000) return '1-5M';
  if (n < 10000000) return '5-10M';
  if (n < 20000000) return '10-20M';
  return '>20M';
}

/* ─── PROGRESS BAR ─── */
function ProgressBar({ step }: { step: number }) {
  const labels = ['Firma', 'Basis', 'Cover', 'Strengths', 'Paket'];
  return (
    <div className="flex items-center gap-2 md:gap-3">
      {labels.map((label, i) => {
        const idx = i + 1;
        const done = step > idx;
        const active = step === idx;
        return (
          <div key={label} className="flex items-center gap-2 md:gap-3 flex-1 last:flex-initial">
            <div className="flex items-center gap-2 min-w-0">
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-caption font-mono font-medium flex-shrink-0 transition-all',
                done ? 'bg-bronze text-cream' :
                active ? 'bg-navy text-cream ring-4 ring-navy/10' :
                'bg-stone text-quiet',
              )}>
                {done ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : idx}
              </div>
              <span className={cn(
                'text-caption hidden md:inline transition-colors',
                active ? 'text-navy font-medium' :
                done ? 'text-bronze-ink' :
                'text-quiet',
              )}>{label}</span>
            </div>
            {idx < labels.length && (
              <div className={cn('flex-1 h-px transition-colors', done ? 'bg-bronze/60' : 'bg-stone')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── STEP 1: ZEFIX (Read-only-Anzeige) ─── */
function Step1Zefix({ data }: { data: Inserat }) {
  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h2 className="font-serif text-display-sm text-navy font-light mb-2">Firma</h2>
        <p className="text-body text-muted">Daten aus dem Schweizer Handelsregister.</p>
      </div>
      <div className="rounded-card bg-paper border border-stone p-6">
        <dl className="grid sm:grid-cols-2 gap-4">
          <Field label="Firmenname (intern)">{data.firma_name ?? '—'}</Field>
          <Field label="UID">{data.zefix_uid ?? '—'}</Field>
          <Field label="Rechtsform">{data.firma_rechtsform ?? '—'}</Field>
        </dl>
      </div>
      {!data.firma_name && (
        <p className="text-body-sm text-quiet text-center">
          Kein Pre-Onboarding gemacht? Im nächsten Schritt kannst du alles eintragen.
        </p>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="overline text-quiet text-caption mb-1">{label}</dt>
      <dd className="text-body text-navy">{children}</dd>
    </div>
  );
}

/* ─── STEP 2: BASIS ─── */
function Step2Basis({ data, update }: { data: Inserat; update: (p: Partial<Inserat>) => void }) {
  // Live-Anonymitäts-Coach (V1: Regex)
  const anonymityWarning = (() => {
    if (!data.firma_name) return null;
    const firstName = data.firma_name.split(/[\s,]/)[0]?.toLowerCase();
    const titleLower = (data.titel ?? '').toLowerCase();
    const descLower = (data.beschreibung ?? '').toLowerCase();
    if (firstName && firstName.length > 3) {
      if (titleLower.includes(firstName) || descLower.includes(firstName)) {
        return `Achtung: Dein Firmenname "${data.firma_name}" taucht im Titel oder der Beschreibung auf. Anonymisiere ihn.`;
      }
    }
    return null;
  })();

  return (
    <div className="space-y-8 animate-fade-up">
      <div>
        <h2 className="font-serif text-display-sm text-navy font-light mb-2">Basis-Daten</h2>
        <p className="text-body text-muted">Diese Angaben sehen Käufer im Marktplatz — anonymisiert.</p>
      </div>

      {anonymityWarning && (
        <div className="rounded-card bg-warn/5 border border-warn/30 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warn flex-shrink-0 mt-0.5" strokeWidth={1.5} />
          <p className="text-body-sm text-warn">{anonymityWarning}</p>
        </div>
      )}

      {/* ── Kategorie + Art (NEU) ───────────────────────────────── */}
      <div>
        <p className="overline text-bronze-ink mb-3">Was du verkaufst</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
          {([
            ['m_a', '💼 Komplette Firma', 'Verkauf der Anteile (M&A)'],
            ['kapital', '💰 Beteiligung', 'Kapital-Investition'],
            ['teilnahme', '🤝 Stille Teilnahme', 'Beteiligung ohne Mitsprache'],
            ['franchise', '🏪 Franchise', 'Franchise-System'],
            ['handelsvertretung', '📦 Handelsvertretung', 'Vertretung'],
            ['shareit', '🔗 ShareIt', 'Cap-Table-Anteil'],
          ] as const).map(([id, label, desc]) => {
            const sel = (data.kategorie ?? 'm_a') === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => update({ kategorie: id })}
                className={cn(
                  'text-left p-3 rounded-soft border-2 transition-all',
                  sel ? 'border-bronze bg-bronze/5' : 'border-stone bg-paper hover:border-bronze/40',
                )}
              >
                <p className="text-body-sm text-navy font-medium">{label}</p>
                <p className="text-caption text-quiet leading-snug mt-0.5">{desc}</p>
              </button>
            );
          })}
        </div>

        <div className="inline-flex bg-stone/40 rounded-soft p-0.5">
          {(['angebot', 'gesuch'] as const).map((opt) => {
            const sel = (data.art ?? 'angebot') === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => update({ art: opt })}
                className={cn(
                  'px-4 py-1.5 rounded-soft text-caption transition-colors',
                  sel ? 'bg-paper text-navy shadow-subtle font-medium' : 'text-quiet',
                )}
              >
                {opt === 'angebot' ? '🟢 Ich verkaufe' : '🔵 Ich suche zu kaufen'}
              </button>
            );
          })}
        </div>
      </div>

      <FormField label="Titel" hint={`${data.titel?.length ?? 0} / 80 Zeichen`}>
        <input
          type="text"
          value={data.titel ?? ''}
          onChange={(e) => update({ titel: e.target.value })}
          maxLength={80}
          placeholder="z. B. Spezialmaschinen für die Präzisionsindustrie"
          className="w-full px-4 py-3 bg-paper border border-stone rounded-soft text-body focus:outline-none focus:border-bronze focus:shadow-focus transition-all"
        />
      </FormField>

      <FormField label="Teaser" hint={`${data.teaser?.length ?? 0} / 280`}>
        <textarea
          value={data.teaser ?? ''}
          onChange={(e) => update({ teaser: e.target.value })}
          maxLength={280}
          rows={3}
          placeholder="Ein kurzer Marketingtext — die ersten Sätze die Käufer sehen."
          className="w-full px-4 py-3 bg-paper border border-stone rounded-soft text-body focus:outline-none focus:border-bronze focus:shadow-focus transition-all resize-none"
        />
      </FormField>

      <FormField label="Beschreibung" hint={`${data.beschreibung?.length ?? 0} / 2000`}>
        <textarea
          value={data.beschreibung ?? ''}
          onChange={(e) => update({ beschreibung: e.target.value })}
          maxLength={2000}
          rows={6}
          placeholder="Volltext-Beschreibung — Käufer sehen diese nach NDA-Signatur."
          className="w-full px-4 py-3 bg-paper border border-stone rounded-soft text-body focus:outline-none focus:border-bronze focus:shadow-focus transition-all resize-none"
        />
      </FormField>

      <div className="grid sm:grid-cols-2 gap-6">
        <FormField label="Branche">
          <select
            value={data.branche_id ?? ''}
            onChange={(e) => update({ branche_id: e.target.value })}
            className="w-full px-4 py-3 bg-paper border border-stone rounded-soft text-body focus:outline-none focus:border-bronze focus:shadow-focus transition-all"
          >
            <option value="">Wähle …</option>
            {BRANCHEN_LIST.map((b) => (
              <option key={b.id} value={b.id}>{b.label}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Kanton">
          <select
            value={data.kanton ?? ''}
            onChange={(e) => update({ kanton: e.target.value })}
            className="w-full px-4 py-3 bg-paper border border-stone rounded-soft text-body focus:outline-none focus:border-bronze focus:shadow-focus transition-all"
          >
            <option value="">Wähle …</option>
            {KANTONE.map(([code, label]) => (
              <option key={code} value={code}>{label} ({code})</option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <FormField label="Gründungsjahr">
          <input
            type="number"
            value={data.jahr ?? ''}
            onChange={(e) => update({ jahr: Number(e.target.value) })}
            min={1800}
            max={new Date().getFullYear()}
            className="w-full px-4 py-3 bg-paper border border-stone rounded-soft text-body font-mono focus:outline-none focus:border-bronze focus:shadow-focus transition-all"
          />
        </FormField>
        <FormField label="Mitarbeitende">
          <input
            type="number"
            value={data.mitarbeitende ?? ''}
            onChange={(e) => update({ mitarbeitende: Number(e.target.value) })}
            min={1}
            className="w-full px-4 py-3 bg-paper border border-stone rounded-soft text-body font-mono focus:outline-none focus:border-bronze focus:shadow-focus transition-all"
          />
        </FormField>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <FormField label="Jahresumsatz (CHF)">
          <input
            type="number"
            value={data.umsatz_chf ?? ''}
            onChange={(e) => update({ umsatz_chf: Number(e.target.value) })}
            placeholder="2000000"
            className="w-full px-4 py-3 bg-paper border border-stone rounded-soft text-body font-mono focus:outline-none focus:border-bronze focus:shadow-focus transition-all"
          />
        </FormField>
        <FormField label="EBITDA (CHF)">
          <input
            type="number"
            value={data.ebitda_chf ?? ''}
            onChange={(e) => update({ ebitda_chf: Number(e.target.value) })}
            placeholder="350000"
            className="w-full px-4 py-3 bg-paper border border-stone rounded-soft text-body font-mono focus:outline-none focus:border-bronze focus:shadow-focus transition-all"
          />
        </FormField>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 items-end">
        <FormField label="Kaufpreis (CHF)">
          <input
            type="number"
            value={data.kaufpreis_chf ?? ''}
            onChange={(e) => update({ kaufpreis_chf: Number(e.target.value) })}
            disabled={data.kaufpreis_vhb}
            placeholder="2500000"
            className="w-full px-4 py-3 bg-paper border border-stone rounded-soft text-body font-mono focus:outline-none focus:border-bronze focus:shadow-focus transition-all disabled:opacity-40"
          />
        </FormField>
        <label className="flex items-center gap-2 text-body-sm text-ink cursor-pointer">
          <input
            type="checkbox"
            checked={data.kaufpreis_vhb}
            onChange={(e) => update({ kaufpreis_vhb: e.target.checked })}
            className="h-4 w-4 accent-bronze"
          />
          <span>Verhandlungsbasis (VHB)</span>
        </label>
      </div>

      {/* Optional: Preis-Range (Min/Max) */}
      <details className="group">
        <summary className="cursor-pointer text-caption text-bronze-ink hover:text-bronze list-none flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5 group-open:rotate-45 transition-transform" strokeWidth={1.5} />
          Stattdessen Preis-Range angeben (Min/Max)
        </summary>
        <div className="grid sm:grid-cols-2 gap-4 mt-3">
          <FormField label="Mindestens (CHF)">
            <input
              type="number"
              value={data.kaufpreis_min_chf ?? ''}
              onChange={(e) => update({ kaufpreis_min_chf: Number(e.target.value) })}
              placeholder="2000000"
              className="w-full px-4 py-3 bg-paper border border-stone rounded-soft text-body font-mono focus:outline-none focus:border-bronze focus:shadow-focus transition-all"
            />
          </FormField>
          <FormField label="Höchstens (CHF)">
            <input
              type="number"
              value={data.kaufpreis_max_chf ?? ''}
              onChange={(e) => update({ kaufpreis_max_chf: Number(e.target.value) })}
              placeholder="3000000"
              className="w-full px-4 py-3 bg-paper border border-stone rounded-soft text-body font-mono focus:outline-none focus:border-bronze focus:shadow-focus transition-all"
            />
          </FormField>
        </div>
      </details>

      <FormField label="Erforderliches Eigenkapital für den Käufer (optional)" hint="meist 20-30 % vom Kaufpreis">
        <input
          type="number"
          value={data.eigenkapital_chf ?? ''}
          onChange={(e) => update({ eigenkapital_chf: Number(e.target.value) })}
          placeholder="500000"
          className="w-full px-4 py-3 bg-paper border border-stone rounded-soft text-body font-mono focus:outline-none focus:border-bronze focus:shadow-focus transition-all"
        />
      </FormField>

      <div className="grid sm:grid-cols-2 gap-6">
        <FormField label="Übergabe-Grund">
          <select
            value={data.uebergabe_grund ?? ''}
            onChange={(e) => update({ uebergabe_grund: e.target.value })}
            className="w-full px-4 py-3 bg-paper border border-stone rounded-soft text-body focus:outline-none focus:border-bronze focus:shadow-focus transition-all"
          >
            <option value="">Wähle …</option>
            {UEBERGABE_GRUENDE.map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Übergabe-Zeitpunkt">
          <select
            value={data.uebergabe_zeitpunkt ?? ''}
            onChange={(e) => update({ uebergabe_zeitpunkt: e.target.value })}
            className="w-full px-4 py-3 bg-paper border border-stone rounded-soft text-body focus:outline-none focus:border-bronze focus:shadow-focus transition-all"
          >
            <option value="">Wähle …</option>
            <option value="sofort">Sofort</option>
            <option value="3M">In 3 Monaten</option>
            <option value="6M">In 6 Monaten</option>
            <option value="12M">In 12 Monaten</option>
            <option value="offen">Offen</option>
          </select>
        </FormField>
      </div>

      {/* ── Konditionen (NEU) ──────────────────────────────────── */}
      <div className="rounded-card bg-cream/50 border border-stone p-5 space-y-5">
        <p className="overline text-bronze-ink">Konditionen</p>

        <FormField label="Finanzierung — bist du offen für Verkäufer-Darlehen?">
          <div className="grid sm:grid-cols-3 gap-2">
            {([
              ['selbst', '🔒 Nur Selbst-Finanzierung', 'Käufer braucht volles Kapital'],
              ['abzahlung', '💸 Abzahlung möglich', 'Verkäufer-Darlehen verhandelbar'],
              ['verhandlungsfaehig', '🤝 Voll verhandelbar', 'Alles offen — wir sprechen drüber'],
            ] as const).map(([id, label, desc]) => {
              const sel = data.finanzierung === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => update({ finanzierung: id })}
                  className={cn(
                    'text-left p-3 rounded-soft border-2 transition-all',
                    sel ? 'border-bronze bg-bronze/10' : 'border-stone bg-paper hover:border-bronze/40',
                  )}
                >
                  <p className="text-body-sm text-navy font-medium">{label}</p>
                  <p className="text-caption text-quiet leading-snug mt-0.5">{desc}</p>
                </button>
              );
            })}
          </div>
        </FormField>

        <FormField label="Immobilien — sind welche dabei?">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {([
              ['keine', '🚫 Keine'],
              ['eigentum', '🏠 Eigentum inkl.'],
              ['miete', '📜 Miete übernehmbar'],
              ['auf_anfrage', '❓ Auf Anfrage'],
            ] as const).map(([id, label]) => {
              const sel = data.immobilien === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => update({ immobilien: id })}
                  className={cn(
                    'p-2.5 rounded-soft border-2 text-body-sm transition-all',
                    sel ? 'border-bronze bg-bronze/10 text-navy font-medium' : 'border-stone bg-paper text-ink hover:border-bronze/40',
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </FormField>

        <label className="flex items-start gap-3 cursor-pointer p-3 rounded-soft hover:bg-paper/60 transition-colors">
          <input
            type="checkbox"
            checked={data.wir_anteil_moeglich}
            onChange={(e) => update({ wir_anteil_moeglich: e.target.checked })}
            className="h-4 w-4 accent-bronze mt-0.5"
          />
          <div className="flex-1">
            <p className="text-body-sm text-navy font-medium">WIR-Anteil möglich</p>
            <p className="text-caption text-quiet leading-snug">
              Käufer kann einen Teil des Kaufpreises in Schweizer WIR bezahlen — ein Schweizer Trust-Signal.
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}

/* ─── STEP 3: COVER ─── */
function Step3Cover({
  data, update, inseratId,
}: {
  data: Inserat;
  update: (p: Partial<Inserat>) => void;
  inseratId: string;
}) {
  const [tab, setTab] = useState<'stockfoto' | 'upload'>(data.cover_source === 'upload' ? 'upload' : 'stockfoto');
  const [uploading, setUploading] = useState(false);

  const stockfotoKey = data.branche_id ? BRANCHE_TO_STOCKFOTO_KEY[data.branche_id] : null;
  const stockfotos = stockfotoKey && STOCKFOTOS_BY_BRANCHE[stockfotoKey]
    ? STOCKFOTOS_BY_BRANCHE[stockfotoKey]
    : FALLBACK_STOCKFOTOS;

  async function handleUpload(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      alert('Datei zu gross (max 5 MB)');
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('inserat_id', inseratId);
    try {
      const res = await fetch('/api/inserate/upload-cover', { method: 'POST', body: fd });
      if (!res.ok) {
        const txt = await res.text();
        alert('Upload fehlgeschlagen: ' + txt);
        return;
      }
      const { url } = await res.json();
      update({ cover_url: url, cover_source: 'upload' });
    } catch (err) {
      alert('Upload-Fehler');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-8 animate-fade-up">
      <div>
        <h2 className="font-serif text-display-sm text-navy font-light mb-2">Cover-Bild</h2>
        <p className="text-body text-muted">Wähle ein Stockfoto zur Branche oder lade ein eigenes Bild hoch.</p>
      </div>

      <div className="inline-flex bg-stone/40 rounded-soft p-1">
        <button
          type="button"
          onClick={() => setTab('stockfoto')}
          className={cn(
            'px-4 py-2 rounded-soft text-body-sm font-medium transition-colors',
            tab === 'stockfoto' ? 'bg-paper text-navy shadow-subtle' : 'text-quiet',
          )}
        >
          <ImageIcon className="w-4 h-4 inline mr-2" strokeWidth={1.5} />
          Stockfoto wählen
        </button>
        <button
          type="button"
          onClick={() => setTab('upload')}
          className={cn(
            'px-4 py-2 rounded-soft text-body-sm font-medium transition-colors',
            tab === 'upload' ? 'bg-paper text-navy shadow-subtle' : 'text-quiet',
          )}
        >
          <UploadIcon className="w-4 h-4 inline mr-2" strokeWidth={1.5} />
          Eigenes Bild hochladen
        </button>
      </div>

      {tab === 'stockfoto' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {stockfotos.map((url, i) => {
            const selected = data.cover_url === url;
            return (
              <button
                key={url + i}
                type="button"
                onClick={() => update({ cover_url: url, cover_source: 'stockfoto' })}
                className={cn(
                  'relative aspect-[16/10] rounded-card overflow-hidden border-2 transition-all',
                  selected ? 'border-bronze shadow-lift scale-[0.98]' : 'border-transparent hover:border-bronze/40 hover:scale-[1.02]',
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
                {selected && (
                  <div className="absolute inset-0 bg-bronze/20 flex items-center justify-center">
                    <div className="w-10 h-10 bg-bronze rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-cream" strokeWidth={2.5} />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div>
          <label className="relative block">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
              }}
              className="sr-only"
              disabled={uploading}
            />
            <div className={cn(
              'rounded-card border-2 border-dashed p-12 text-center transition-all cursor-pointer',
              uploading ? 'border-bronze bg-bronze/5' : 'border-stone hover:border-bronze/40 hover:bg-bronze/5',
            )}>
              {uploading ? (
                <Loader2 className="w-10 h-10 mx-auto text-bronze animate-spin mb-3" strokeWidth={1.5} />
              ) : (
                <UploadIcon className="w-10 h-10 mx-auto text-quiet mb-3" strokeWidth={1.5} />
              )}
              <p className="text-body text-navy font-medium mb-1">
                {uploading ? 'Wird hochgeladen …' : 'Klicken zum Auswählen'}
              </p>
              <p className="text-caption text-quiet">JPG, PNG, WebP · max 5 MB · empfohlen 1600×1000</p>
            </div>
          </label>

          {data.cover_url && data.cover_source === 'upload' && (
            <div className="mt-4 rounded-card overflow-hidden border border-stone">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.cover_url} alt="" className="w-full aspect-[16/9] object-cover" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── STEP 4: STRENGTHS ─── */
function Step4Strengths({
  data, update,
}: { data: Inserat; update: (p: Partial<Inserat>) => void }) {
  const [draft, setDraft] = useState('');
  const points = data.sales_points ?? [];

  const SUGGESTIONS = [
    'Stabile Auftragslage seit über 10 Jahren',
    'TOP 3 in der Region',
    'Eingespieltes Team — nicht inhaberabhängig',
    'Wachsende EBITDA-Marge',
    'Diversifizierte Kundenstruktur',
    'Modernes Maschinen-/IT-Inventar',
    'Sofort übernehmbar',
  ];

  function addPoint(text: string) {
    if (!text.trim() || points.length >= 5) return;
    update({ sales_points: [...points, text.trim().slice(0, 80)] });
    setDraft('');
  }
  function removePoint(i: number) {
    update({ sales_points: points.filter((_, j) => j !== i) });
  }

  return (
    <div className="space-y-8 animate-fade-up">
      <div>
        <h2 className="font-serif text-display-sm text-navy font-light mb-2">Stärken</h2>
        <p className="text-body text-muted">3–5 prägnante Punkte, die dein Unternehmen auszeichnen. Käufer sehen sie sofort.</p>
      </div>

      <ul className="space-y-2">
        {points.map((p, i) => (
          <li key={i} className="flex items-center gap-3 rounded-soft bg-paper border border-stone px-4 py-3">
            <span className="font-mono text-caption text-bronze-ink font-medium w-6">{i + 1}.</span>
            <span className="flex-1 text-body text-ink">{p}</span>
            <button
              type="button"
              onClick={() => removePoint(i)}
              className="text-quiet hover:text-danger p-1 -mr-1 transition-colors"
              aria-label="Entfernen"
            >
              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </li>
        ))}
      </ul>

      {points.length < 5 && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && draft.trim()) {
                  e.preventDefault();
                  addPoint(draft);
                }
              }}
              maxLength={80}
              placeholder="Eigene Stärke eingeben (Enter)"
              className="flex-1 px-4 py-3 bg-paper border border-stone rounded-soft text-body focus:outline-none focus:border-bronze focus:shadow-focus transition-all"
            />
            <button
              type="button"
              onClick={() => addPoint(draft)}
              disabled={!draft.trim()}
              className="px-4 py-3 bg-navy text-cream rounded-soft text-body-sm font-medium hover:bg-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>

          <div>
            <p className="overline text-quiet text-caption mb-2">Vorschläge</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.filter((s) => !points.includes(s)).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addPoint(s)}
                  className="px-3 py-1.5 rounded-pill border border-stone bg-paper text-caption text-ink hover:border-bronze/40 hover:bg-bronze/5 transition-colors"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <p className="text-caption text-quiet">{points.length} / 5 Stärken</p>
    </div>
  );
}

/* ─── STEP 5: PAKET — Smart-Auto-Tier + Powerups + Checkout ─── */
function Step5Paket({
  data, inseratId,
}: {
  data: Inserat;
  update: (p: Partial<Inserat>) => void;
  inseratId: string;
  onPaid: () => void;
}) {
  const router = useRouter();

  // Smart-Auto-Empfehlung: aus dem Verkaufspreis bestimmen wir das Paket
  const verkaufswert = (() => {
    if (!data.kaufpreis_chf) return null;
    const v = typeof data.kaufpreis_chf === 'string' ? parseFloat(data.kaufpreis_chf) : data.kaufpreis_chf;
    return Number.isFinite(v) ? v : null;
  })();
  const empfohlenId = recommendPaket(verkaufswert);

  const [selectedPaket, setSelectedPaket] = useState<string>(empfohlenId);
  const [selectedPowerups, setSelectedPowerups] = useState<Set<string>>(new Set());

  if (data.paid_at) {
    return (
      <div className="text-center py-16 animate-fade-up">
        <div className="w-16 h-16 mx-auto rounded-full bg-success/15 flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-success" strokeWidth={2} />
        </div>
        <h2 className="font-serif text-head-md text-navy mb-2">Paket gebucht</h2>
        <p className="text-body text-muted mb-6">
          Dein <strong className="text-navy uppercase">{data.paket}</strong>-Paket ist aktiv. Wir prüfen dein Inserat — meist innerhalb 24h.
        </p>
      </div>
    );
  }

  const togglePowerup = (id: string) => {
    setSelectedPowerups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  function goToCheckout() {
    const params = new URLSearchParams({
      inserat: inseratId,
      paket: selectedPaket,
    });
    if (selectedPowerups.size > 0) {
      params.set('powerups', Array.from(selectedPowerups).join(','));
    }
    router.push(`/dashboard/verkaeufer/checkout?${params.toString()}`);
  }

  // Total berechnen
  const paket = NEW_PAKETE.find((p) => p.id === selectedPaket) ?? NEW_PAKETE[1];
  const powerupsSum = NEW_POWERUPS
    .filter((p) => selectedPowerups.has(p.id))
    .reduce((s, p) => s + p.preis, 0);
  const subtotal = paket.preis + powerupsSum;
  const mwst = Math.round(subtotal * 0.081 * 100) / 100;
  const total = Math.round((subtotal + mwst) * 100) / 100;

  return (
    <div className="space-y-10 animate-fade-up">
      <div>
        <h2 className="font-serif text-display-sm text-navy font-light mb-2">Paket wählen</h2>
        <p className="text-body text-muted">
          Wir haben dir basierend auf deinem Verkaufspreis das passende Paket vorgeschlagen.
          Einmalige Gebühr · keine Erfolgsprovision · alle Preise zzgl. 8.1 % MwSt.
        </p>
      </div>

      {/* Smart-Empfehlung Hint */}
      {verkaufswert && (
        <div className="rounded-card bg-bronze/5 border border-bronze/30 p-4 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-bronze flex-shrink-0 mt-0.5" strokeWidth={1.5} />
          <p className="text-body-sm text-navy">
            <strong>Empfehlung für dich:</strong> Bei einem Verkaufswert von ca.{' '}
            <span className="font-mono">CHF {(verkaufswert / 1000).toFixed(0)}K</span>{' '}
            passt das <strong className="text-bronze-ink">{paket.label}-Paket</strong> am besten.
          </p>
        </div>
      )}

      {/* Paket-Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {NEW_PAKETE.map((p) => {
          const isSelected = selectedPaket === p.id;
          const isRecommended = empfohlenId === p.id;
          const cmDiff = getCompanymarketDifference(p.preis, p.preisRefCompanymarket);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedPaket(p.id)}
              className={cn(
                'text-left rounded-card border-2 p-5 flex flex-col relative transition-all',
                isSelected
                  ? 'border-bronze shadow-lift bg-paper'
                  : 'border-stone bg-paper hover:border-bronze/40',
              )}
            >
              {isRecommended && (
                <span className="absolute -top-3 left-4 inline-flex items-center px-2.5 py-0.5 rounded-pill bg-bronze text-cream text-caption font-medium">
                  Empfohlen
                </span>
              )}
              {p.highlight && !isRecommended && (
                <span className="absolute -top-3 left-4 inline-flex items-center px-2.5 py-0.5 rounded-pill bg-navy text-cream text-caption font-medium">
                  Beliebt
                </span>
              )}
              <p className="overline text-quiet mb-1">Inserat {p.label}</p>
              <p className="font-serif text-[2rem] text-navy font-light font-tabular leading-none mb-1">
                CHF {p.preis}
              </p>
              <p className="text-caption text-quiet font-mono mb-1">
                {p.laufzeitMonate ? `${p.laufzeitMonate} Monate` : 'Bis Verkauf'}
              </p>
              {cmDiff && (
                <p className="text-caption text-success leading-tight mb-4">
                  {cmDiff}
                </p>
              )}
              {!cmDiff && <div className="mb-4" />}
              <ul className="space-y-1.5 mb-2 flex-1">
                {p.features.slice(0, 5).map((f) => (
                  <li key={f} className="text-caption text-muted flex items-start gap-1.5 leading-snug">
                    <Check className="w-3 h-3 text-bronze flex-shrink-0 mt-1" strokeWidth={2} />
                    {f}
                  </li>
                ))}
                {p.features.length > 5 && (
                  <li className="text-caption text-quiet italic ml-4">
                    + {p.features.length - 5} weitere
                  </li>
                )}
              </ul>
              {isSelected && (
                <div className="mt-3 inline-flex items-center gap-1.5 text-caption text-bronze-ink font-medium">
                  <Check className="w-3.5 h-3.5" strokeWidth={2} />
                  Ausgewählt
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Powerups-Marketplace */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-head-sm text-navy font-light">
            Powerups dazubuchen <span className="text-quiet font-sans text-body-sm">(optional)</span>
          </h3>
          {selectedPowerups.size > 0 && (
            <span className="text-caption text-bronze-ink font-mono">
              {selectedPowerups.size} ausgewählt
            </span>
          )}
        </div>

        {(['sichtbarkeit', 'reichweite', 'tools', 'service'] as const).map((kat) => {
          const items = NEW_POWERUPS.filter((p) => p.kategorie === kat);
          if (!items.length) return null;
          const titel = {
            sichtbarkeit: '🚀 Sichtbarkeit',
            reichweite: '📡 Reichweite',
            tools: '🛠 Tools (KI-generiert)',
            service: '🤝 Service',
          }[kat];
          return (
            <div key={kat}>
              <p className="overline text-bronze-ink mb-2">{titel}</p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                {items.map((pu) => {
                  const isSelected = selectedPowerups.has(pu.id);
                  const cmDiff = getCompanymarketDifference(pu.preis, pu.preisRefCompanymarket);
                  return (
                    <button
                      key={pu.id}
                      type="button"
                      onClick={() => togglePowerup(pu.id)}
                      className={cn(
                        'text-left p-3.5 rounded-soft border transition-all',
                        isSelected
                          ? 'border-bronze bg-bronze/5'
                          : 'border-stone bg-paper hover:border-bronze/40',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-body-sm text-navy font-medium">{pu.label}</p>
                        <p className="text-body-sm font-mono text-ink whitespace-nowrap">
                          CHF {pu.preis}
                        </p>
                      </div>
                      <p className="text-caption text-quiet leading-snug mb-1">{pu.beschreibung}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-caption text-quiet font-mono">{pu.einheit}</span>
                        {cmDiff && (
                          <span className="text-caption text-success">
                            {cmDiff.replace('Bei Companymarket CHF ', '↓ CM ')}
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <div className="mt-2 inline-flex items-center gap-1 text-caption text-bronze-ink">
                          <Check className="w-3 h-3" strokeWidth={2} />
                          Hinzugefügt
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky Order-Summary + Checkout-Button */}
      <div className="rounded-card bg-paper border border-stone p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <p className="text-body-sm text-muted">
              <strong className="text-navy">{paket.label}-Paket</strong>
              {selectedPowerups.size > 0 && ` + ${selectedPowerups.size} Powerup${selectedPowerups.size === 1 ? '' : 's'}`}
            </p>
            <p className="text-caption text-quiet">inkl. 8.1 % MwSt.</p>
          </div>
          <p className="font-serif text-[2rem] text-navy font-light font-tabular leading-none">
            CHF {total.toFixed(2).replace(/\.00$/, '')}
          </p>
        </div>
        <button
          type="button"
          onClick={goToCheckout}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-soft text-body font-medium bg-navy text-cream hover:bg-ink shadow-card hover:shadow-lift hover:-translate-y-px transition-all"
        >
          Weiter zur Zahlung →
        </button>
        <p className="text-caption text-quiet text-center mt-3">
          Sichere Zahlung über Stripe · Schweizer Datenschutz · 0 % Erfolgsprovision
        </p>
      </div>
    </div>
  );
}

/* ─── HELPERS ─── */
function FormField({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="overline text-bronze-ink">{label}</label>
        {hint && <span className="text-caption font-mono text-quiet">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
