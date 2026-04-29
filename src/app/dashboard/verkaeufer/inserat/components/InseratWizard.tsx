'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft, Check, Loader2, AlertTriangle, Image as ImageIcon, Upload as UploadIcon, Sparkles, Trash2, Plus } from 'lucide-react';
import { saveStep, mockPaketKaufen, submitForReview } from '../actions';
import { BRANCHEN_LIST } from '@/data/branchen-multiples';
import { STOCKFOTOS_BY_BRANCHE } from '@/data/branchen-stockfotos';
import { CurrencyInput, formatCHSwiss } from '@/components/ui/currency-input';
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
  // Anonymität
  anonymitaet_level: 'voll_anonym' | 'vorname_funktion' | 'voll_offen' | null;
  whatsapp_enabled: boolean;
  live_chat_enabled: boolean;
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
    return {
      sales_points: d.sales_points,
      anonymitaet_level: d.anonymitaet_level ?? 'voll_anonym',
      whatsapp_enabled: d.whatsapp_enabled ? 'true' : 'false',
      live_chat_enabled: d.live_chat_enabled ? 'true' : 'false',
    };
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

  // EBITDA-Validation: Marge darf nicht > 100% sein (= EBITDA > Umsatz)
  const umsatzNum = data.umsatz_chf ? Number(data.umsatz_chf) : 0;
  const ebitdaNum = data.ebitda_chf ? Number(data.ebitda_chf) : 0;
  const ebitdaWarning = umsatzNum > 0 && ebitdaNum > umsatzNum
    ? 'EBITDA kann nicht höher sein als der Umsatz. Bitte korrigieren.'
    : null;

  // Pre-Reg-Daten kompakt zeigen, falls schon erfasst (Branche/Kanton/Jahr/MA/Umsatz/EBITDA)
  const preRegDataComplete = Boolean(
    data.branche_id && data.kanton &&
    data.umsatz_chf != null && data.ebitda_chf != null,
  );

  return (
    <div className="space-y-8 animate-fade-up">
      <div>
        <h2 className="font-serif text-display-sm text-navy font-light mb-2">Inserat-Inhalt</h2>
        <p className="text-body text-muted">Diese Angaben sehen Käufer im Marktplatz — anonymisiert.</p>
      </div>

      {anonymityWarning && (
        <div className="rounded-card bg-warn/5 border border-warn/30 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warn flex-shrink-0 mt-0.5" strokeWidth={1.5} />
          <p className="text-body-sm text-warn">{anonymityWarning}</p>
        </div>
      )}

      {/* ── Bereits erfasste Daten (kompakte Read-Only-Card) ─────── */}
      {preRegDataComplete && (
        <div className="rounded-card bg-bronze/5 border border-bronze/30 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="overline text-bronze-ink">Aus deinem Pre-Onboarding übernommen</p>
            <button
              type="button"
              onClick={() => alert('Bereits-erfasste-Felder kannst du im Dashboard unter Einstellungen anpassen.')}
              className="text-caption text-bronze-ink hover:text-bronze underline-offset-4 hover:underline"
            >
              Anpassen →
            </button>
          </div>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-caption">
            <div>
              <dt className="text-quiet">Branche</dt>
              <dd className="text-ink font-medium">
                {BRANCHEN_LIST.find((b) => b.id === data.branche_id)?.label ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-quiet">Kanton</dt>
              <dd className="text-ink font-medium">{data.kanton}</dd>
            </div>
            {data.jahr && (
              <div>
                <dt className="text-quiet">Gegründet</dt>
                <dd className="text-ink font-medium font-mono">{data.jahr}</dd>
              </div>
            )}
            {data.mitarbeitende && (
              <div>
                <dt className="text-quiet">Mitarbeitende</dt>
                <dd className="text-ink font-medium font-mono">{data.mitarbeitende}</dd>
              </div>
            )}
            <div>
              <dt className="text-quiet">Umsatz</dt>
              <dd className="text-ink font-medium font-mono">
                CHF {formatCHSwiss(Number(data.umsatz_chf))}
              </dd>
            </div>
            <div>
              <dt className="text-quiet">EBITDA</dt>
              <dd className="text-ink font-medium font-mono">
                CHF {formatCHSwiss(Number(data.ebitda_chf))}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {/* ── Kategorie (ohne Emojis, ohne Art-Toggle) ─────────────── */}
      <FormField label="Kategorie" required>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {([
            ['m_a', 'Komplette Firma', 'Verkauf der Anteile (M&A)'],
            ['kapital', 'Beteiligung', 'Kapital-Investition'],
            ['teilnahme', 'Stille Teilnahme', 'Ohne Mitsprache'],
            ['franchise', 'Franchise', 'Franchise-System'],
            ['handelsvertretung', 'Handelsvertretung', 'Vertretung'],
            ['shareit', 'ShareIt', 'Cap-Table-Anteil'],
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
      </FormField>

      <FormField label="Titel" required hint={`${data.titel?.length ?? 0} / 80 Zeichen`}>
        <input
          type="text"
          value={data.titel ?? ''}
          onChange={(e) => update({ titel: e.target.value })}
          maxLength={80}
          placeholder="z. B. Spezialmaschinen für die Präzisionsindustrie"
          className="w-full px-4 py-3 bg-paper border border-stone rounded-soft text-body focus:outline-none focus:border-bronze focus:shadow-focus transition-all"
        />
      </FormField>

      <FormField label="Teaser" hint={`${data.teaser?.length ?? 0} / 280 · optional`}>
        <textarea
          value={data.teaser ?? ''}
          onChange={(e) => update({ teaser: e.target.value })}
          maxLength={280}
          rows={3}
          placeholder="Kurzer Marketingtext — die ersten Sätze die Käufer sehen."
          className="w-full px-4 py-3 bg-paper border border-stone rounded-soft text-body focus:outline-none focus:border-bronze focus:shadow-focus transition-all resize-none"
        />
      </FormField>

      <FormField label="Beschreibung" required hint={`${data.beschreibung?.length ?? 0} / 2000`}>
        <textarea
          value={data.beschreibung ?? ''}
          onChange={(e) => update({ beschreibung: e.target.value })}
          maxLength={2000}
          rows={6}
          placeholder="Volltext-Beschreibung — Käufer sehen diese nach NDA-Signatur."
          className="w-full px-4 py-3 bg-paper border border-stone rounded-soft text-body focus:outline-none focus:border-bronze focus:shadow-focus transition-all resize-none"
        />
      </FormField>

      {/* Branche/Kanton nur anzeigen, falls noch nicht aus Pre-Reg da */}
      {!preRegDataComplete && (
        <div className="grid sm:grid-cols-2 gap-6">
          <FormField label="Branche" required>
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
          <FormField label="Kanton" required>
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
      )}

      {/* Gründungsjahr und Mitarbeitende sind optional, falls nicht aus Pre-Reg */}
      {!preRegDataComplete && (
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
      )}

      {/* Jahresumsatz/EBITDA nur anzeigen, falls noch nicht aus Pre-Reg da */}
      {!preRegDataComplete && (
        <>
          <div className="grid sm:grid-cols-2 gap-6">
            <FormField label="Jahresumsatz" required>
              <CurrencyInput
                value={data.umsatz_chf}
                onChange={(v) => update({ umsatz_chf: v as any })}
                placeholder="2'000'000"
              />
            </FormField>
            <FormField
              label="EBITDA"
              required
              hint={ebitdaWarning ? undefined : 'darf höchstens dem Umsatz entsprechen'}
            >
              <CurrencyInput
                value={data.ebitda_chf}
                onChange={(v) => {
                  if (v != null && umsatzNum > 0 && v > umsatzNum) {
                    update({ ebitda_chf: umsatzNum as any });
                  } else {
                    update({ ebitda_chf: v as any });
                  }
                }}
                placeholder="350'000"
              />
              {ebitdaWarning && (
                <p className="mt-1.5 text-caption text-warn">{ebitdaWarning}</p>
              )}
            </FormField>
          </div>
        </>
      )}

      <div className="grid sm:grid-cols-2 gap-6 items-end">
        <FormField
          label="Kaufpreis"
          required
          hint={data.kaufpreis_chf ? 'Empfehlung — anpassbar' : undefined}
        >
          <CurrencyInput
            value={data.kaufpreis_chf}
            onChange={(v) => update({ kaufpreis_chf: v as any })}
            disabled={data.kaufpreis_vhb}
            placeholder="2'500'000"
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
          <FormField label="Mindestens">
            <CurrencyInput
              value={data.kaufpreis_min_chf}
              onChange={(v) => update({ kaufpreis_min_chf: v as any })}
              placeholder="2'000'000"
            />
          </FormField>
          <FormField label="Höchstens">
            <CurrencyInput
              value={data.kaufpreis_max_chf}
              onChange={(v) => update({ kaufpreis_max_chf: v as any })}
              placeholder="3'000'000"
            />
          </FormField>
        </div>
      </details>

      <FormField label="Erforderliches Eigenkapital für den Käufer (optional)" hint="meist 20-30 % vom Kaufpreis">
        <CurrencyInput
          value={data.eigenkapital_chf}
          onChange={(v) => update({ eigenkapital_chf: v as any })}
          placeholder="500'000"
        />
      </FormField>

      <div className="grid sm:grid-cols-2 gap-6">
        <FormField label="Übergabe-Grund" required>
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
        <FormField label="Übergabe-Zeitpunkt" required>
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
              ['selbst', 'Nur Selbst-Finanzierung', 'Käufer braucht volles Kapital'],
              ['abzahlung', 'Abzahlung möglich', 'Verkäufer-Darlehen verhandelbar'],
              ['verhandlungsfaehig', 'Voll verhandelbar', 'Alles offen — wir sprechen drüber'],
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
              ['keine', 'Keine'],
              ['eigentum', 'Eigentum inkl.'],
              ['miete', 'Miete übernehmbar'],
              ['auf_anfrage', 'Auf Anfrage'],
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
        <h2 className="font-serif text-display-sm text-navy font-light mb-2">Titelbild wählen</h2>
        <p className="text-body text-muted">Wähle ein passendes Bild zur Branche oder lade ein eigenes hoch.</p>
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
          Aus Auswahl wählen
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

      {/* ── Galerie: weitere Bilder (optional, bis 8) ───────────── */}
      <GalerieSection inseratId={inseratId} />
    </div>
  );
}

/* ─── GALERIE: weitere Bilder hochladen + sortieren ─── */
function GalerieSection({ inseratId }: { inseratId: string }) {
  const [items, setItems] = useState<Array<{ id: string; url: string; sortierung: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/inserate/galerie?inserat=${inseratId}`);
      const data = await res.json();
      if (res.ok) setItems(data.items ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [inseratId]);  // eslint-disable-line react-hooks/exhaustive-deps

  async function handleUpload(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setErr('Datei zu gross (max 5 MB)');
      return;
    }
    setUploading(true);
    setErr(null);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('inserat_id', inseratId);
    try {
      const res = await fetch('/api/inserate/galerie', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? 'Upload fehlgeschlagen');
      } else {
        await load();
      }
    } catch {
      setErr('Netzwerk-Fehler');
    } finally {
      setUploading(false);
    }
  }

  async function move(id: string, dir: -1 | 1) {
    const idx = items.findIndex((x) => x.id === id);
    if (idx < 0) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= items.length) return;
    const newItems = [...items];
    [newItems[idx], newItems[newIdx]] = [newItems[newIdx], newItems[idx]];
    setItems(newItems);
    await fetch('/api/inserate/galerie', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inserat_id: inseratId, order: newItems.map((x) => x.id) }),
    });
  }

  async function remove(id: string) {
    if (!confirm('Bild wirklich löschen?')) return;
    setItems(items.filter((x) => x.id !== id));
    await fetch(`/api/inserate/galerie?id=${id}`, { method: 'DELETE' });
  }

  return (
    <div className="space-y-4 pt-2">
      <div>
        <h3 className="font-serif text-head-sm text-navy font-light mb-1">Weitere Bilder hochladen</h3>
        <p className="text-body-sm text-muted">
          Optional · bis 8 Bilder · JPG/PNG/WebP · max 5 MB pro Bild · per Pfeil hoch/runter sortieren
        </p>
      </div>

      {err && (
        <div className="rounded-soft bg-danger/5 border border-danger/30 px-4 py-2.5 text-body-sm text-danger">
          {err}
        </div>
      )}

      {/* Upload-Slot */}
      {items.length < 8 && (
        <label className="block cursor-pointer">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
              e.target.value = '';
            }}
            className="sr-only"
            disabled={uploading}
          />
          <div className="border-2 border-dashed border-stone hover:border-bronze/50 rounded-card p-6 text-center transition-colors">
            {uploading ? (
              <Loader2 className="w-6 h-6 mx-auto text-bronze animate-spin mb-2" strokeWidth={1.5} />
            ) : (
              <Plus className="w-6 h-6 mx-auto text-quiet mb-2" strokeWidth={1.5} />
            )}
            <p className="text-body-sm text-navy font-medium">
              {uploading ? 'Wird hochgeladen …' : 'Bild hinzufügen'}
            </p>
            <p className="text-caption text-quiet mt-1">
              {items.length} von 8 Bildern
            </p>
          </div>
        </label>
      )}

      {/* Liste mit Up/Down */}
      {!loading && items.length > 0 && (
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li
              key={item.id}
              className="flex items-center gap-3 p-3 bg-paper border border-stone rounded-soft"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt=""
                className="w-20 h-14 object-cover rounded-soft border border-stone flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-caption text-quiet font-mono">Position {i + 1}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(item.id, -1)}
                  disabled={i === 0}
                  className="w-8 h-8 inline-flex items-center justify-center rounded-soft hover:bg-stone/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Nach oben"
                >
                  <ArrowLeft className="w-4 h-4 text-muted rotate-90" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={() => move(item.id, 1)}
                  disabled={i === items.length - 1}
                  className="w-8 h-8 inline-flex items-center justify-center rounded-soft hover:bg-stone/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Nach unten"
                >
                  <ArrowLeft className="w-4 h-4 text-muted -rotate-90" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  className="w-8 h-8 inline-flex items-center justify-center rounded-soft hover:bg-danger/10 text-quiet hover:text-danger transition-colors"
                  aria-label="Löschen"
                >
                  <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            </li>
          ))}
        </ul>
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
    <div className="space-y-10 animate-fade-up">
      <div>
        <h2 className="font-serif text-display-sm text-navy font-light mb-2">Stärken & Sichtbarkeit</h2>
        <p className="text-body text-muted">Wer dich sieht und wie sichtbar dein Inserat ist.</p>
      </div>

      {/* ── Anonymitätsstufen ──────────────────────────────────── */}
      <div>
        <p className="overline text-bronze-ink mb-3">Wer du bist <span className="text-quiet font-sans normal-case tracking-normal">— wähle dein Anonymitäts-Level</span></p>
        <div className="grid md:grid-cols-3 gap-3">
          {([
            ['voll_anonym', 'Voll Anonym', 'Käufer sieht nur «Anfragen» — empfohlen für Standard-Verkauf', '🎭'],
            ['vorname_funktion', 'Vorname + Funktion', 'z.B. «Marc, Inhaber» — etwas persönlicher, immer noch anonym', '👤'],
            ['voll_offen', 'Voll offen', 'Name, Foto, LinkedIn — für Berater und Premium-Mandate', '🆔'],
          ] as const).map(([id, label, desc]) => {
            const sel = (data.anonymitaet_level ?? 'voll_anonym') === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => update({ anonymitaet_level: id })}
                className={cn(
                  'text-left p-4 rounded-card border-2 transition-all',
                  sel ? 'border-bronze bg-bronze/5 shadow-subtle' : 'border-stone bg-paper hover:border-bronze/40',
                )}
              >
                <p className="text-body text-navy font-medium mb-1">{label}</p>
                <p className="text-caption text-quiet leading-snug">{desc}</p>
                {id === 'voll_anonym' && (
                  <p className="text-caption text-bronze-ink mt-2 inline-flex items-center gap-1 font-medium">
                    <Check className="w-3 h-3" strokeWidth={2.5} />
                    Empfohlen
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Erreichbarkeit-Toggles ─────────────────────────────── */}
      <div className="space-y-3">
        <p className="overline text-bronze-ink">Erreichbarkeit <span className="text-quiet font-sans normal-case tracking-normal">— optional</span></p>
        <label className="flex items-start gap-3 cursor-pointer p-4 bg-paper border border-stone rounded-soft hover:border-bronze/40 transition-colors">
          <input
            type="checkbox"
            checked={data.whatsapp_enabled}
            onChange={(e) => update({ whatsapp_enabled: e.target.checked })}
            className="h-4 w-4 accent-bronze mt-1"
          />
          <div className="flex-1">
            <p className="text-body-sm text-navy font-medium">WhatsApp-Quick-Contact</p>
            <p className="text-caption text-quiet leading-snug">
              Käufer können dich mit einem Klick direkt via WhatsApp anschreiben — auch ohne NDA.
              Nur Vorname wird sichtbar.
            </p>
          </div>
        </label>
        <label className="flex items-start gap-3 cursor-pointer p-4 bg-paper border border-stone rounded-soft hover:border-bronze/40 transition-colors">
          <input
            type="checkbox"
            checked={data.live_chat_enabled}
            onChange={(e) => update({ live_chat_enabled: e.target.checked })}
            className="h-4 w-4 accent-bronze mt-1"
          />
          <div className="flex-1">
            <p className="text-body-sm text-navy font-medium">Live-Chat aktivieren</p>
            <p className="text-caption text-quiet leading-snug">
              Aktive Käufer können dir im Inserat eine Sofort-Nachricht schicken. Du bekommst Push-Notifications.
            </p>
          </div>
        </label>
      </div>

      {/* ── Sales-Points / Stärken ─────────────────────────────── */}
      <div>
        <p className="overline text-bronze-ink mb-3">Highlights <span className="text-quiet font-sans normal-case tracking-normal">— 3 bis 5 Punkte, die Käufer sofort überzeugen</span></p>
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

  // Apple-Funnel: 3 Sub-Frames
  // 1 = Paket wählen · 2 = Powerups · 3 = Zusammenfassung
  const [subFrame, setSubFrame] = useState<1 | 2 | 3>(1);

  return (
    <div className="animate-fade-up">
      {/* Sub-Frame Indicator (Apple-style 3 dots) */}
      <div className="flex items-center justify-center gap-2 mb-10">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className={cn(
              'h-1.5 rounded-pill transition-all',
              subFrame === n ? 'w-8 bg-bronze' : subFrame > n ? 'w-1.5 bg-bronze/60' : 'w-1.5 bg-stone',
            )}
          />
        ))}
      </div>

      {/* ── FRAME 1: Paket wählen ──────────────────────────────── */}
      {subFrame === 1 && (
        <div className="space-y-10 animate-fade-up">
          <div className="text-center">
            <p className="overline text-bronze-ink mb-3">Schritt 1 von 3</p>
            <h2 className="font-serif text-display-md text-navy font-light tracking-tight mb-3">
              Welches Paket passt zu dir?
            </h2>
            <p className="text-body-lg text-muted max-w-prose mx-auto">
              {verkaufswert
                ? <>Bei einem Verkaufswert von <span className="font-mono text-navy">CHF {(verkaufswert / 1000).toFixed(0)}K</span> empfehlen wir das <strong className="text-bronze-ink">{NEW_PAKETE.find(p => p.id === empfohlenId)?.label}-Paket</strong>.</>
                : 'Wir haben für jeden Verkaufswert das passende Paket — pauschal, ohne Folgekosten.'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {NEW_PAKETE.map((p) => {
              const isSelected = selectedPaket === p.id;
              const isRecommended = empfohlenId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPaket(p.id)}
                  className={cn(
                    'text-left rounded-card border-2 p-6 md:p-7 flex flex-col relative transition-all',
                    isSelected
                      ? 'border-bronze shadow-lift bg-paper -translate-y-1'
                      : 'border-stone bg-paper hover:border-bronze/40 hover:-translate-y-0.5',
                  )}
                >
                  {isRecommended && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center px-3 py-0.5 rounded-pill bg-bronze text-cream text-caption font-medium whitespace-nowrap">
                      Für dich empfohlen
                    </span>
                  )}
                  {p.highlight && !isRecommended && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center px-3 py-0.5 rounded-pill bg-navy text-cream text-caption font-medium">
                      Beliebt
                    </span>
                  )}
                  <div className="flex items-baseline justify-between gap-3 mb-1">
                    <p className="overline text-quiet">{p.label}</p>
                    {/* Bewertungsbereich */}
                    <p className="text-caption text-quiet font-mono whitespace-nowrap">
                      {p.bewertungsbereich.max
                        ? `bis CHF ${formatCHSwiss(p.bewertungsbereich.max / 1000)}K`
                        : `> CHF 10 Mio`}
                    </p>
                  </div>
                  <p className="font-serif text-[3rem] text-navy font-light font-tabular leading-none mb-2">
                    CHF {formatCHSwiss(p.preis)}
                  </p>
                  <p className="text-caption text-quiet mb-6">
                    Pauschalpreis · {p.laufzeitMonate ? `${p.laufzeitMonate} Monate` : 'aktiv bis Verkauf'}
                  </p>
                  <ul className="space-y-2.5 mb-6 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="text-body-sm text-muted flex items-start gap-2 leading-snug">
                        <Check className="w-3.5 h-3.5 text-bronze flex-shrink-0 mt-0.5" strokeWidth={2} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  {isSelected && (
                    <div className="inline-flex items-center gap-1.5 text-caption text-bronze-ink font-medium">
                      <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                      Ausgewählt
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex justify-center pt-4">
            <button
              type="button"
              onClick={() => setSubFrame(2)}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-soft text-body font-medium bg-navy text-cream hover:bg-ink shadow-card hover:shadow-lift hover:-translate-y-px transition-all"
            >
              Weiter zu den Powerups →
            </button>
          </div>
        </div>
      )}

      {/* ── FRAME 2: Powerups dazubuchen ───────────────────────── */}
      {subFrame === 2 && (
        <div className="space-y-10 animate-fade-up">
          <div className="text-center">
            <p className="overline text-bronze-ink mb-3">Schritt 2 von 3</p>
            <h2 className="font-serif text-display-md text-navy font-light tracking-tight mb-3">
              Mehr Reichweite gefällig?
            </h2>
            <p className="text-body-lg text-muted max-w-prose mx-auto">
              Optional: einzeln dazubuchbar. Du kannst Powerups auch später jederzeit hinzufügen.
            </p>
          </div>

          {(['sichtbarkeit', 'reichweite', 'tools', 'service'] as const).map((kat) => {
            const items = NEW_POWERUPS.filter((p) => p.kategorie === kat);
            if (!items.length) return null;
            const titel = {
              sichtbarkeit: 'Sichtbarkeit',
              reichweite: 'Reichweite',
              tools: 'Tools',
              service: 'Service',
            }[kat];
            return (
              <div key={kat} className="max-w-5xl mx-auto">
                <h3 className="font-serif text-head-md text-navy font-light mb-4">{titel}</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((pu) => {
                    const isSelected = selectedPowerups.has(pu.id);
                    return (
                      <button
                        key={pu.id}
                        type="button"
                        onClick={() => togglePowerup(pu.id)}
                        className={cn(
                          'text-left p-5 rounded-card border-2 transition-all',
                          isSelected
                            ? 'border-bronze bg-bronze/5 shadow-subtle'
                            : 'border-stone bg-paper hover:border-bronze/40',
                        )}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <p className="text-body text-navy font-medium leading-tight">{pu.label}</p>
                          <p className="text-body font-mono text-navy whitespace-nowrap">
                            CHF {pu.preis}
                          </p>
                        </div>
                        <p className="text-body-sm text-muted leading-relaxed mb-2">{pu.beschreibung}</p>
                        <p className="text-caption text-quiet">{pu.einheit}</p>
                        {isSelected && (
                          <div className="mt-3 inline-flex items-center gap-1.5 text-caption text-bronze-ink font-medium">
                            <Check className="w-3 h-3" strokeWidth={2.5} />
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

          <div className="flex items-center justify-between max-w-5xl mx-auto pt-6">
            <button
              type="button"
              onClick={() => setSubFrame(1)}
              className="text-body-sm text-muted hover:text-navy transition-colors"
            >
              ← Zurück
            </button>
            <button
              type="button"
              onClick={() => setSubFrame(3)}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-soft text-body font-medium bg-navy text-cream hover:bg-ink shadow-card hover:shadow-lift hover:-translate-y-px transition-all"
            >
              {selectedPowerups.size > 0 ? `Mit ${selectedPowerups.size} Powerup${selectedPowerups.size === 1 ? '' : 's'} weiter` : 'Ohne Powerups weiter'} →
            </button>
          </div>
        </div>
      )}

      {/* ── FRAME 3: Zusammenfassung ───────────────────────────── */}
      {subFrame === 3 && (
        <div className="space-y-8 animate-fade-up max-w-2xl mx-auto">
          <div className="text-center">
            <p className="overline text-bronze-ink mb-3">Schritt 3 von 3</p>
            <h2 className="font-serif text-display-md text-navy font-light tracking-tight mb-3">
              Alles bereit?
            </h2>
            <p className="text-body-lg text-muted">Das ist deine Bestellung — kurzer Check, dann zur Zahlung.</p>
          </div>

          <div className="bg-paper border border-stone rounded-card p-6 md:p-8">
            {/* Paket-Block */}
            <div className="flex items-start justify-between pb-5 border-b border-stone">
              <div>
                <p className="text-caption text-quiet mb-1">Paket</p>
                <p className="text-body-lg text-navy font-medium">Inserat {paket.label}</p>
                <p className="text-caption text-quiet mt-1">
                  {paket.laufzeitMonate ? `${paket.laufzeitMonate} Monate` : 'Aktiv bis zum Verkauf'}
                </p>
              </div>
              <p className="text-body-lg font-mono text-navy">CHF {paket.preis}</p>
            </div>

            {/* Powerups-Block */}
            {selectedPowerups.size > 0 && (
              <div className="py-5 border-b border-stone space-y-3">
                <p className="text-caption text-quiet">Powerups</p>
                {NEW_POWERUPS.filter((pu) => selectedPowerups.has(pu.id)).map((pu) => (
                  <div key={pu.id} className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-body text-ink">{pu.label}</p>
                      <p className="text-caption text-quiet">{pu.einheit}</p>
                    </div>
                    <p className="text-body font-mono text-ink ml-4">CHF {pu.preis}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Total */}
            <div className="pt-5 space-y-2">
              <div className="flex justify-between text-body-sm text-muted">
                <span>Zwischensumme</span>
                <span className="font-mono">CHF {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-body-sm text-muted">
                <span>MwSt 8.1 %</span>
                <span className="font-mono">CHF {mwst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-baseline pt-3 border-t border-stone mt-3">
                <span className="text-body text-navy font-medium">Gesamt</span>
                <span className="font-serif text-[2rem] text-navy font-light font-tabular">
                  CHF {total.toFixed(2).replace(/\.00$/, '').replace(/,/g, "'")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 pt-2">
            <button
              type="button"
              onClick={goToCheckout}
              className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 rounded-soft text-body font-medium bg-navy text-cream hover:bg-ink shadow-card hover:shadow-lift hover:-translate-y-px transition-all"
            >
              Weiter zur Zahlung →
            </button>
            <button
              type="button"
              onClick={() => setSubFrame(2)}
              className="text-body-sm text-muted hover:text-navy transition-colors"
            >
              ← Powerups anpassen
            </button>
          </div>

          <p className="text-caption text-quiet text-center pt-2">
            Pauschalpreis · 0 % Erfolgsprovision · Schweizer Datenschutz
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── HELPERS ─── */
function FormField({
  label, hint, required, children,
}: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="overline text-bronze-ink inline-flex items-center gap-1">
          {label}
          {required && <span className="text-warn">*</span>}
        </label>
        {hint && <span className="text-caption font-mono text-quiet">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
