'use client';

import { useState, useEffect, useTransition, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft, Check, Loader2, AlertTriangle, Image as ImageIcon, Upload as UploadIcon, Sparkles, Trash2, Plus, Zap, Mail, Clock } from 'lucide-react';
import { saveStep, mockPaketKaufen, submitForReview } from '../actions';
import { BRANCHEN_LIST } from '@/data/branchen-multiples';
import { STOCKFOTOS_BY_BRANCHE } from '@/data/branchen-stockfotos';
import { CurrencyInput, formatCHSwiss } from '@/components/ui/currency-input';
import { useTypewriter } from '@/lib/use-typewriter';
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
import {
  PAKETE_LIST as NEW_PAKETE,
  POWERUPS as NEW_POWERUPS,
  recommendPaket,
  getCompanymarketDifference,
  isKleinInserat,
  KLEIN_INSERAT_SCHWELLE_CHF,
  KLEIN_INSERAT_RABATT_PCT,
  type Laufzeit,
} from '@/data/pakete';

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
  // Kontakt-Felder (je nach anonymitaet_level sichtbar)
  kontakt_vorname: string | null;
  kontakt_nachname: string | null;
  kontakt_funktion: string | null;
  kontakt_foto_url: string | null;
  kontakt_email_public: string | null;
  kontakt_whatsapp_nr: string | null;
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
    if (step === 2) {
      // EBITDA <= Umsatz (max 100 % Marge) — sonst nicht weiter.
      const umsatzN = Number(data.umsatz_chf ?? 0);
      const ebitdaN = Number(data.ebitda_chf ?? 0);
      const ebitdaUngueltig = umsatzN > 0 && ebitdaN > umsatzN;
      return Boolean(
        data.titel && data.titel.length >= 10 &&
        data.branche_id &&
        data.kanton &&
        data.jahr &&
        data.mitarbeitende &&
        data.umsatz_chf &&
        data.ebitda_chf !== null && data.ebitda_chf !== undefined &&
        !ebitdaUngueltig,
      );
    }
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
        {step === 2 && <Step2Basis data={data} update={update} fromPreReg={fromPreReg} />}
        {step === 3 && <Step3Cover data={data} update={update} inseratId={inserat.id} />}
        {step === 4 && <Step4Strengths data={data} update={update} inseratId={inserat.id} />}
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
    const level = d.anonymitaet_level ?? 'voll_anonym';
    // Live-Chat ist immer aktiv. WhatsApp-Quick-Contact automatisch aktiv
    // wenn Level 'voll_offen' UND WhatsApp-Nr ausgefüllt ist.
    const whatsappAuto = level === 'voll_offen' && Boolean(d.kontakt_whatsapp_nr?.trim());
    return {
      sales_points: d.sales_points,
      anonymitaet_level: level,
      whatsapp_enabled: whatsappAuto ? 'true' : 'false',
      live_chat_enabled: 'true',
      // Kontakt-Felder je nach Level (bei voll_anonym alle null)
      kontakt_vorname: level === 'voll_anonym' ? null : (d.kontakt_vorname ?? null),
      kontakt_nachname: level === 'voll_offen' ? (d.kontakt_nachname ?? null) : null,
      kontakt_funktion: level === 'voll_anonym' ? null : (d.kontakt_funktion ?? null),
      kontakt_foto_url: level === 'voll_offen' ? (d.kontakt_foto_url ?? null) : null,
      kontakt_email_public: level === 'voll_offen' ? (d.kontakt_email_public ?? null) : null,
      kontakt_whatsapp_nr: level === 'voll_offen' ? (d.kontakt_whatsapp_nr ?? null) : null,
      linkedin_url: level === 'voll_offen' ? (d.linkedin_url ?? null) : d.linkedin_url,
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
function Step2Basis({
  data, update, fromPreReg,
}: {
  data: Inserat;
  update: (p: Partial<Inserat>) => void;
  fromPreReg: boolean;
}) {
  // ── Typewriter-Effekt für Pre-Reg-Auto-Fill ──────────────────────
  // Cyrill: «Wenn man zuerst auf die Seite kommt ist alles leer und
  // man sieht wie die Felder automatisch befüllt werden, als würde
  // jemand schreiben — cooler Wow-Effekt».
  // titel zuerst, dann teaser, dann beschreibung sequenziell.
  const titelTyper = useTypewriter(data.titel ?? '', {
    enabled: fromPreReg,
    startDelay: 200,
    charDelay: 12,
  });
  const teaserStartDelay = 200 + (data.titel?.length ?? 0) * 12 + 250;
  const teaserTyper = useTypewriter(data.teaser ?? '', {
    enabled: fromPreReg,
    startDelay: teaserStartDelay,
    charDelay: 8,
  });
  const beschreibungStartDelay = teaserStartDelay + (data.teaser?.length ?? 0) * 8 + 250;
  const beschreibungTyper = useTypewriter(data.beschreibung ?? '', {
    enabled: fromPreReg,
    startDelay: beschreibungStartDelay,
    charDelay: 5,
  });
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

  // Pre-Reg-Daten kompakt zeigen, falls schon erfasst.
  // WICHTIG: jahr UND mitarbeitende müssen mitgeprüft werden — sonst
  // werden die Felder versteckt obwohl sie noch fehlen, und der User
  // kommt im canProceed nicht weiter (Bug "Gründungsjahr nicht aus
  // Handelsregister übernommen" — Field war gar nicht sichtbar).
  const preRegDataComplete = Boolean(
    data.branche_id && data.kanton &&
    data.umsatz_chf != null && data.ebitda_chf != null &&
    data.jahr != null && data.mitarbeitende != null,
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

      {/* Read-Only-Card entfernt — Cyrill: «Gründungsjahr wird nicht
          übernommen». Stattdessen sind ALLE Felder unten IMMER sichtbar
          und editierbar, vor-befüllt mit Pre-Reg-Werten falls vorhanden. */}

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

      <FormField label="Titel" required hint={`${(titelTyper.isTyping ? titelTyper.text : data.titel ?? '').length} / 80 Zeichen`}>
        <input
          type="text"
          value={titelTyper.isTyping ? titelTyper.text : (data.titel ?? '')}
          onChange={(e) => { titelTyper.complete(); update({ titel: e.target.value }); }}
          onFocus={() => titelTyper.complete()}
          maxLength={80}
          placeholder="z. B. Spezialmaschinen für die Präzisionsindustrie"
          className={cn(
            'w-full px-4 py-3 bg-paper border border-stone rounded-soft text-body focus:outline-none focus:border-bronze focus:shadow-focus transition-all',
            titelTyper.isTyping && 'caret-bronze',
          )}
        />
      </FormField>

      <FormField label="Teaser" hint={`${(teaserTyper.isTyping ? teaserTyper.text : data.teaser ?? '').length} / 280 · optional`}>
        <textarea
          value={teaserTyper.isTyping ? teaserTyper.text : (data.teaser ?? '')}
          onChange={(e) => { teaserTyper.complete(); update({ teaser: e.target.value }); }}
          onFocus={() => teaserTyper.complete()}
          maxLength={280}
          rows={3}
          placeholder="Kurzer Marketingtext — die ersten Sätze die Käufer sehen."
          className={cn(
            'w-full px-4 py-3 bg-paper border border-stone rounded-soft text-body focus:outline-none focus:border-bronze focus:shadow-focus transition-all resize-none',
            teaserTyper.isTyping && 'caret-bronze',
          )}
        />
      </FormField>

      <FormField label="Beschreibung" required hint={`${(beschreibungTyper.isTyping ? beschreibungTyper.text : data.beschreibung ?? '').length} / 2000`}>
        <textarea
          value={beschreibungTyper.isTyping ? beschreibungTyper.text : (data.beschreibung ?? '')}
          onChange={(e) => { beschreibungTyper.complete(); update({ beschreibung: e.target.value }); }}
          onFocus={() => beschreibungTyper.complete()}
          maxLength={2000}
          rows={6}
          placeholder="Volltext-Beschreibung — Käufer sehen diese nach NDA-Signatur."
          className={cn(
            'w-full px-4 py-3 bg-paper border border-stone rounded-soft text-body focus:outline-none focus:border-bronze focus:shadow-focus transition-all resize-none',
            beschreibungTyper.isTyping && 'caret-bronze',
          )}
        />
      </FormField>

      {/* Branche/Kanton — IMMER sichtbar (vor-befüllt aus Pre-Reg falls da). */}
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

      {/* Gründungsjahr + Mitarbeitende — IMMER sichtbar.
          Vorher: nur wenn !preRegDataComplete → Field war versteckt obwohl
          Wert fehlt, wenn Zefix-Lookup das Jahr nicht zurückgab.
          Mitarbeitende = einfaches Eingabefeld (keine Bucket-Buttons mehr). */}
      <div className="grid sm:grid-cols-2 gap-6">
        <FormField label="Gründungsjahr" required>
          <input
            type="number"
            value={data.jahr ?? ''}
            onChange={(e) => update({ jahr: Number(e.target.value) })}
            min={1800}
            max={new Date().getFullYear()}
            placeholder="1987"
            className="w-full px-4 py-3 bg-paper border border-stone rounded-soft text-body font-mono focus:outline-none focus:border-bronze focus:shadow-focus transition-all"
          />
        </FormField>
        <FormField label="Mitarbeitende" required>
          <input
            type="number"
            value={data.mitarbeitende ?? ''}
            onChange={(e) => update({ mitarbeitende: Number(e.target.value) })}
            min={1}
            placeholder="20"
            className="w-full px-4 py-3 bg-paper border border-stone rounded-soft text-body font-mono focus:outline-none focus:border-bronze focus:shadow-focus transition-all"
          />
        </FormField>
      </div>

      {/* Jahresumsatz + EBITDA — IMMER sichtbar.
          EBITDA wird hart auf max=Umsatz gecappt (100 % Marge). */}
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
        >
          <CurrencyInput
            value={data.ebitda_chf}
            onChange={(v) => update({ ebitda_chf: v as any })}
            placeholder="350'000"
          />
          {ebitdaWarning && (
            <p className="mt-1.5 text-caption text-warn font-medium">{ebitdaWarning}</p>
          )}
        </FormField>
      </div>

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
  // Drag & Drop visual state — Cyrill: «ich will reinziehen können, nicht klicken & Ordner»
  const [isDragOver, setIsDragOver] = useState(false);

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
          <label
            className="relative block"
            onDragOver={(e) => {
              e.preventDefault();
              if (!uploading) setIsDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragOver(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              if (uploading) return;
              const file = e.dataTransfer.files?.[0];
              if (!file) return;
              if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                alert('Nur JPG, PNG oder WebP erlaubt');
                return;
              }
              handleUpload(file);
            }}
          >
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
              uploading
                ? 'border-bronze bg-bronze/5'
                : isDragOver
                  ? 'border-bronze bg-bronze/10 scale-[1.01]'
                  : 'border-stone hover:border-bronze/40 hover:bg-bronze/5',
            )}>
              {uploading ? (
                <Loader2 className="w-10 h-10 mx-auto text-bronze animate-spin mb-3" strokeWidth={1.5} />
              ) : (
                <UploadIcon className={cn('w-10 h-10 mx-auto mb-3 transition-colors', isDragOver ? 'text-bronze' : 'text-quiet')} strokeWidth={1.5} />
              )}
              <p className="text-body text-navy font-medium mb-1">
                {uploading ? 'Wird hochgeladen …' : isDragOver ? 'Bild loslassen' : 'Bild hierher ziehen oder klicken'}
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
  const [isDragOver, setIsDragOver] = useState(false);

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

      {/* Upload-Slot — D&D + Klick. Cyrill: «reinziehen, nicht klicken». */}
      {items.length < 8 && (
        <label
          className="block cursor-pointer"
          onDragOver={(e) => {
            e.preventDefault();
            if (!uploading) setIsDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            if (uploading) return;
            const file = e.dataTransfer.files?.[0];
            if (!file) return;
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
              setErr('Nur JPG, PNG oder WebP');
              return;
            }
            handleUpload(file);
          }}
        >
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
          <div className={cn(
            'border-2 border-dashed rounded-card p-6 text-center transition-all',
            uploading
              ? 'border-bronze bg-bronze/5'
              : isDragOver
                ? 'border-bronze bg-bronze/10 scale-[1.01]'
                : 'border-stone hover:border-bronze/50',
          )}>
            {uploading ? (
              <Loader2 className="w-6 h-6 mx-auto text-bronze animate-spin mb-2" strokeWidth={1.5} />
            ) : (
              <Plus className={cn('w-6 h-6 mx-auto mb-2 transition-colors', isDragOver ? 'text-bronze' : 'text-quiet')} strokeWidth={1.5} />
            )}
            <p className="text-body-sm text-navy font-medium">
              {uploading ? 'Wird hochgeladen …' : isDragOver ? 'Bild loslassen' : 'Bild hierher ziehen oder klicken'}
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
  data, update, inseratId,
}: { data: Inserat; update: (p: Partial<Inserat>) => void; inseratId: string }) {
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
  function editPoint(i: number, value: string) {
    update({ sales_points: points.map((p, j) => (j === i ? value.slice(0, 80) : p)) });
  }

  // ── Drag & Drop für Highlights (HTML5 native) ──────────────────
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  function reorderPoints(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= points.length || to >= points.length) return;
    const next = [...points];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    update({ sales_points: next });
  }

  const level = data.anonymitaet_level ?? 'voll_anonym';

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
            ['voll_anonym', 'Voll Anonym', 'Käufer sieht nur «Anfragen» — empfohlen für Standard-Verkauf'],
            ['vorname_funktion', 'Vorname + Funktion', 'z.B. «Marc, Inhaber» — etwas persönlicher, immer noch anonym'],
            ['voll_offen', 'Voll offen', 'Name, Foto, LinkedIn, WhatsApp — für Berater und Premium-Mandate'],
          ] as const).map(([id, label, desc]) => {
            const sel = level === id;
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

      {/* ── Kontakt-Felder je nach Level ───────────────────────── */}
      {level === 'vorname_funktion' && (
        <div className="space-y-3 animate-fade-up">
          <p className="overline text-bronze-ink">Deine Daten <span className="text-quiet font-sans normal-case tracking-normal">— Käufer sehen «{data.kontakt_vorname || 'Vorname'}, {data.kontakt_funktion || 'Funktion'}»</span></p>
          <div className="grid md:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-caption text-quiet block mb-1.5">Vorname</span>
              <input
                type="text"
                value={data.kontakt_vorname ?? ''}
                onChange={(e) => update({ kontakt_vorname: e.target.value })}
                placeholder="z.B. Marc"
                maxLength={50}
                className="w-full px-4 py-3 bg-paper border border-stone rounded-soft text-body focus:outline-none focus:border-bronze focus:shadow-focus transition-all"
              />
            </label>
            <label className="block">
              <span className="text-caption text-quiet block mb-1.5">Funktion</span>
              <input
                type="text"
                value={data.kontakt_funktion ?? ''}
                onChange={(e) => update({ kontakt_funktion: e.target.value })}
                placeholder="z.B. Inhaber, CEO, CFO"
                maxLength={50}
                className="w-full px-4 py-3 bg-paper border border-stone rounded-soft text-body focus:outline-none focus:border-bronze focus:shadow-focus transition-all"
              />
            </label>
          </div>
        </div>
      )}

      {level === 'voll_offen' && (
        <div className="space-y-5 animate-fade-up">
          <p className="overline text-bronze-ink">Deine Daten <span className="text-quiet font-sans normal-case tracking-normal">— alles optional, fülle aus was Käufer sehen sollen</span></p>

          {/* Profilbild — File-Upload */}
          <KontaktFotoUpload
            inseratId={inseratId}
            currentUrl={data.kontakt_foto_url}
            onUploaded={(url) => update({ kontakt_foto_url: url })}
            onRemoved={() => update({ kontakt_foto_url: null })}
          />

          {/* Name + Funktion */}
          <div className="grid md:grid-cols-3 gap-3">
            <label className="block">
              <span className="text-caption text-quiet block mb-1.5">Vorname</span>
              <input
                type="text"
                value={data.kontakt_vorname ?? ''}
                onChange={(e) => update({ kontakt_vorname: e.target.value })}
                placeholder="Marc"
                maxLength={50}
                className="w-full px-4 py-3 bg-paper border border-stone rounded-soft text-body focus:outline-none focus:border-bronze focus:shadow-focus transition-all"
              />
            </label>
            <label className="block">
              <span className="text-caption text-quiet block mb-1.5">Nachname</span>
              <input
                type="text"
                value={data.kontakt_nachname ?? ''}
                onChange={(e) => update({ kontakt_nachname: e.target.value })}
                placeholder="Müller"
                maxLength={50}
                className="w-full px-4 py-3 bg-paper border border-stone rounded-soft text-body focus:outline-none focus:border-bronze focus:shadow-focus transition-all"
              />
            </label>
            <label className="block">
              <span className="text-caption text-quiet block mb-1.5">Funktion</span>
              <input
                type="text"
                value={data.kontakt_funktion ?? ''}
                onChange={(e) => update({ kontakt_funktion: e.target.value })}
                placeholder="Inhaber, CEO"
                maxLength={50}
                className="w-full px-4 py-3 bg-paper border border-stone rounded-soft text-body focus:outline-none focus:border-bronze focus:shadow-focus transition-all"
              />
            </label>
          </div>

          {/* Direkt-Kontakte */}
          <div className="grid md:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-caption text-quiet block mb-1.5">E-Mail (öffentlich sichtbar)</span>
              <input
                type="email"
                value={data.kontakt_email_public ?? ''}
                onChange={(e) => update({ kontakt_email_public: e.target.value })}
                placeholder="kontakt@firma.ch"
                className="w-full px-4 py-3 bg-paper border border-stone rounded-soft text-body focus:outline-none focus:border-bronze focus:shadow-focus transition-all"
              />
            </label>
            <label className="block">
              <span className="text-caption text-quiet block mb-1.5">WhatsApp-Nummer</span>
              <input
                type="tel"
                value={data.kontakt_whatsapp_nr ?? ''}
                onChange={(e) => update({ kontakt_whatsapp_nr: e.target.value })}
                placeholder="+41 79 123 45 67"
                className="w-full px-4 py-3 bg-paper border border-stone rounded-soft text-body focus:outline-none focus:border-bronze focus:shadow-focus transition-all"
              />
            </label>
          </div>

          {/* LinkedIn */}
          <label className="block">
            <span className="text-caption text-quiet block mb-1.5">LinkedIn-Profil (optional)</span>
            <input
              type="url"
              value={data.linkedin_url ?? ''}
              onChange={(e) => update({ linkedin_url: e.target.value })}
              placeholder="https://linkedin.com/in/..."
              className="w-full px-4 py-3 bg-paper border border-stone rounded-soft text-body focus:outline-none focus:border-bronze focus:shadow-focus transition-all"
            />
          </label>
        </div>
      )}

      {/* ── Sales-Points / Stärken ─────────────────────────────── */}
      <div>
        <p className="overline text-bronze-ink mb-3">Highlights <span className="text-quiet font-sans normal-case tracking-normal">— 3 bis 5 Punkte, die Käufer sofort überzeugen · Reihenfolge per Drag &amp; Drop ändern</span></p>
      </div>

      <ul className="space-y-2">
        {points.map((p, i) => {
          const isDragged = draggedIdx === i;
          const isOver = dragOverIdx === i;
          return (
            <li
              key={`${p}-${i}`}
              draggable
              onDragStart={() => setDraggedIdx(i)}
              onDragEnd={() => { setDraggedIdx(null); setDragOverIdx(null); }}
              onDragOver={(e) => { e.preventDefault(); setDragOverIdx(i); }}
              onDragLeave={() => setDragOverIdx((cur) => cur === i ? null : cur)}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedIdx !== null) reorderPoints(draggedIdx, i);
                setDraggedIdx(null);
                setDragOverIdx(null);
              }}
              className={cn(
                'flex items-center gap-3 rounded-soft bg-paper border px-4 py-3 cursor-grab active:cursor-grabbing transition-all',
                isDragged && 'opacity-40',
                isOver && !isDragged && 'border-bronze bg-bronze/5 -translate-y-0.5 shadow-subtle',
                !isOver && !isDragged && 'border-stone',
              )}
            >
              {/* Drag-Handle (links) — bewusst NICHT auf das ganze li,
                  damit das Input-Feld klickbar bleibt. */}
              <span
                className="text-quiet text-caption select-none cursor-grab active:cursor-grabbing"
                aria-hidden
                title="Reihenfolge ändern"
              >⋮⋮</span>
              <span className="font-mono text-caption text-bronze-ink font-medium w-6">{i + 1}.</span>
              {/* Inline-Edit — Cyrill: «nicht nur verschieben, auch bearbeiten». */}
              <input
                type="text"
                value={p}
                onChange={(e) => editPoint(i, e.target.value)}
                maxLength={80}
                draggable={false}
                onDragStart={(e) => e.stopPropagation()}
                className="flex-1 bg-transparent text-body text-ink focus:outline-none focus:bg-cream/50 px-1.5 py-0.5 -mx-1.5 -my-0.5 rounded-soft transition-colors cursor-text"
              />
              <button
                type="button"
                onClick={() => removePoint(i)}
                className="text-quiet hover:text-danger p-1 -mr-1 transition-colors"
                aria-label="Entfernen"
              >
                <Trash2 className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </li>
          );
        })}
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
  const [laufzeit, setLaufzeit] = useState<Laufzeit>(12);

  // Klein-Inserat-Rabatt automatisch erkannt aus Kaufpreis
  const klein = isKleinInserat({
    kaufpreis_chf: typeof data.kaufpreis_chf === 'number' ? data.kaufpreis_chf : Number(data.kaufpreis_chf) || null,
    kaufpreis_max_chf: typeof data.kaufpreis_max_chf === 'number' ? data.kaufpreis_max_chf : Number(data.kaufpreis_max_chf) || null,
    kaufpreis_vhb: data.kaufpreis_vhb,
  });

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

  // Total berechnen — abhängig von Laufzeit + Klein-Rabatt
  const paket = NEW_PAKETE.find((p) => p.id === selectedPaket) ?? NEW_PAKETE[1];
  const paketPreis = klein ? paket.preisKlein[laufzeit] : paket.preis[laufzeit];
  const paketPreisRegulaer = paket.preis[laufzeit];
  const powerupsSum = NEW_POWERUPS
    .filter((p) => selectedPowerups.has(p.id))
    .reduce((s, p) => s + p.preis, 0);
  const subtotal = paketPreis + powerupsSum;
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
        <div className="space-y-8 animate-fade-up">
          <div className="text-center">
            <p className="overline text-bronze-ink mb-3">Schritt 1 von 3</p>
            <h2 className="font-serif text-display-md text-navy font-light tracking-tight mb-3">
              Welches Paket passt zu dir?
            </h2>
          </div>

          {/* Laufzeit-Toggle: 12M = Rabatt-Variante */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-1 p-1 rounded-pill border border-stone bg-paper">
              {([6, 12] as Laufzeit[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLaufzeit(l)}
                  className={cn(
                    'px-5 py-2 rounded-pill text-body-sm transition-all inline-flex items-center gap-2',
                    laufzeit === l ? 'bg-navy text-cream font-medium' : 'text-muted hover:text-navy',
                  )}
                >
                  {l} Monate
                  {l === 12 && (
                    <span className={cn(
                      'text-caption font-medium px-2 py-0.5 rounded-pill',
                      laufzeit === l ? 'bg-bronze text-cream' : 'bg-bronze/15 text-bronze-ink',
                    )}>
                      −20 % Rabatt
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Klein-Rabatt-Hinweis (auto) */}
          {klein && (
            <div className="max-w-3xl mx-auto bg-bronze/5 border border-bronze/30 rounded-card p-4 flex items-start gap-3">
              <span className="text-bronze-ink text-lg">🎁</span>
              <div className="flex-1">
                <p className="text-body-sm text-bronze-ink font-medium">Klein-Inserat-Rabatt {KLEIN_INSERAT_RABATT_PCT} % automatisch aktiv</p>
                <p className="text-caption text-muted mt-0.5">
                  Dein Verkaufspreis liegt unter CHF {KLEIN_INSERAT_SCHWELLE_CHF.toLocaleString('de-CH')} —
                  alle Pakete sind günstiger. Spätere Erhöhung über die Schwelle erfordert Upgrade.
                </p>
              </div>
            </div>
          )}

          {/* Pakete als VERGLEICHS-LISTE — sales-tauglich, grün/rot */}
          <PaketeVergleichsListe
            pakete={NEW_PAKETE}
            selectedId={selectedPaket}
            onSelect={setSelectedPaket}
            laufzeit={laufzeit}
            klein={klein}
            empfohlenId={empfohlenId}
          />

          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => setSubFrame(2)}
              className="inline-flex items-center gap-2 px-10 py-4 rounded-soft text-body font-medium bg-navy text-cream hover:bg-ink shadow-card hover:shadow-lift hover:-translate-y-px transition-all"
            >
              Weiter →
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
              Boosts dazubuchen
            </h2>
            <p className="text-body-lg text-muted max-w-prose mx-auto">
              Drei optionale Boosts. Einzeln zubuchbar, jederzeit aktivierbar — auch später aus dem Dashboard.
            </p>
          </div>

          {/* 3 Apple-Style Boost-Cards */}
          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {NEW_POWERUPS.map((pu) => {
              const isSelected = selectedPowerups.has(pu.id);
              return (
                <button
                  key={pu.id}
                  type="button"
                  onClick={() => togglePowerup(pu.id)}
                  className={cn(
                    'text-left rounded-card border-2 p-7 flex flex-col transition-all relative',
                    isSelected
                      ? 'border-bronze bg-bronze/5 shadow-lift -translate-y-1'
                      : 'border-stone bg-paper hover:border-bronze/40 hover:-translate-y-0.5 hover:shadow-subtle',
                  )}
                >
                  {/* Icon-Bubble */}
                  <div className={cn(
                    'w-12 h-12 rounded-card flex items-center justify-center mb-5 transition-colors',
                    isSelected ? 'bg-bronze text-cream' : 'bg-bronze/10 text-bronze-ink',
                  )}>
                    {pu.icon === 'Zap' && <Zap className="w-5 h-5" strokeWidth={1.75} />}
                    {pu.icon === 'Mail' && <Mail className="w-5 h-5" strokeWidth={1.75} />}
                    {pu.icon === 'Clock' && <Clock className="w-5 h-5" strokeWidth={1.75} />}
                  </div>

                  <h4 className="font-serif text-head-sm text-navy font-normal mb-1">{pu.label}</h4>
                  <p className="text-caption text-quiet mb-4">{pu.einheit}</p>

                  <p className="text-body-sm text-muted leading-relaxed mb-6 flex-1">
                    {pu.beschreibung}
                  </p>

                  <div className="flex items-baseline justify-between mt-auto pt-5 border-t border-stone/60">
                    <p className="font-serif text-head-md text-navy font-light font-tabular">
                      CHF {pu.preis}
                    </p>
                    <p className="text-caption text-quiet">einmalig</p>
                  </div>

                  {/* Auswahl-Indikator unten */}
                  <div className={cn(
                    'mt-4 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-soft text-body-sm font-medium border-2 transition-all',
                    isSelected
                      ? 'bg-bronze border-bronze text-cream'
                      : 'border-stone bg-paper text-muted',
                  )}>
                    {isSelected ? (
                      <>
                        <Check className="w-4 h-4" strokeWidth={2.5} />
                        Hinzugefügt
                      </>
                    ) : (
                      <>+ Dazu buchen</>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Trust-Footer entfernt — Cyrill: «alle diese Häkchen weg». */}

          <div className="flex items-center justify-between max-w-5xl mx-auto pt-2">
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
              {selectedPowerups.size > 0 ? `Mit ${selectedPowerups.size} Boost${selectedPowerups.size === 1 ? '' : 's'} weiter` : 'Ohne Boosts weiter'} →
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
                  {paket.laufzeitMonate} Monate
                </p>
              </div>
              <p className="text-body-lg font-mono text-navy">CHF {paket.preisDefault}</p>
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


/* ─── KontaktFotoUpload ─── Profilbild-Upload für Step4 voll_offen ── */
function KontaktFotoUpload({
  inseratId,
  currentUrl,
  onUploaded,
  onRemoved,
}: {
  inseratId: string;
  currentUrl: string | null;
  onUploaded: (url: string) => void;
  onRemoved: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Nur JPG, PNG oder WebP');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('inserat_id', inseratId);
      const res = await fetch('/api/inserate/upload-kontakt-foto', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok || !json.url) {
        throw new Error(json.error ?? 'Upload fehlgeschlagen');
      }
      onUploaded(json.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <span className="text-caption text-quiet block mb-2">Profilbild (optional · auch reinziehen möglich)</span>
      <div
        className={cn(
          'flex items-center gap-4 rounded-card border-2 border-dashed p-3 transition-all',
          isDragOver ? 'border-bronze bg-bronze/10' : 'border-transparent',
        )}
        onDragOver={(e) => {
          e.preventDefault();
          if (!uploading) setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          if (uploading) return;
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
      >
        <div className="w-20 h-20 rounded-full overflow-hidden bg-stone flex items-center justify-center flex-shrink-0 border border-stone">
          {currentUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={currentUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-quiet text-caption">Foto</span>
          )}
        </div>
        <div className="flex-1 flex items-center gap-3 flex-wrap">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-paper border border-stone hover:border-bronze/40 rounded-soft text-body-sm transition-all disabled:opacity-60"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                Lade hoch …
              </>
            ) : isDragOver ? (
              <>
                <UploadIcon className="w-4 h-4" strokeWidth={1.5} />
                Bild loslassen
              </>
            ) : (
              <>
                <UploadIcon className="w-4 h-4" strokeWidth={1.5} />
                {currentUrl ? 'Anderes Bild wählen' : 'Bild hochladen oder hier reinziehen'}
              </>
            )}
          </button>
          {currentUrl && !uploading && (
            <button
              type="button"
              onClick={onRemoved}
              className="text-caption text-quiet hover:text-danger transition-colors"
            >
              entfernen
            </button>
          )}
        </div>
      </div>
      {error && <p className="text-caption text-danger mt-2">{error}</p>}
      <p className="text-caption text-quiet mt-2">JPG / PNG / WebP · max. 3 MB</p>
    </div>
  );
}

/* ─── PaketeVergleichsListe ─── Sales-Liste mit Features grün/rot ── */
type PaketLight = (typeof NEW_PAKETE)[number];

const FEATURES_VERGLEICH: Array<{
  key: string;
  label: string;
  // pro Paket: true (✓) | false (✗) | string (z.B. "4× / Jahr")
  values: { light: boolean | string; pro: boolean | string; premium: boolean | string };
}> = [
  { key: 'inserat', label: '1 Inserat live', values: { light: true, pro: true, premium: true } },
  { key: 'anfragen', label: 'Anfragen empfangen', values: { light: true, pro: true, premium: true } },
  { key: 'chat', label: 'In-App-Chat mit Käufern', values: { light: true, pro: true, premium: true } },
  { key: 'stats', label: 'Vollständige Statistik (Charts, Conversion)', values: { light: true, pro: true, premium: true } },
  { key: 'datenraum', label: 'Datenraum mit Versionierung', values: { light: false, pro: true, premium: true } },
  { key: 'hervorhebung', label: 'Hervorhebung (Seite 1 + Top Branchenfilter)', values: { light: false, pro: '4× / Jahr', premium: '12× / Jahr' } },
  { key: 'newsletter', label: 'Positionierung im Newsletter', values: { light: false, pro: false, premium: '2× / Jahr' } },
  { key: 'team', label: 'Mehrere Mitarbeiter onboarden', values: { light: false, pro: false, premium: 'bis 3' } },
  { key: 'kaeufer', label: 'Käuferprofil-Einsicht bei Anfragen', values: { light: false, pro: false, premium: true } },
];

function PaketeVergleichsListe({
  pakete,
  selectedId,
  onSelect,
  laufzeit,
  klein,
  empfohlenId,
}: {
  pakete: readonly PaketLight[];
  selectedId: string;
  onSelect: (id: string) => void;
  laufzeit: 6 | 12;
  klein: boolean;
  empfohlenId: string;
}) {
  // Helper: NUR EIN Badge pro Spalte (Empfohlen > Beliebt).
  // Kurze Texte + whitespace-nowrap → Pille bleibt 1-zeilig.
  function badgeFor(p: PaketLight): { label: string; cls: string } | null {
    if (empfohlenId === p.id) return { label: 'Empfohlen', cls: 'bg-bronze text-cream' };
    if (p.highlight) return { label: 'Beliebteste', cls: 'bg-navy text-cream' };
    return null;
  }

  return (
    // Cyrill: «Pakete-Liste geht zu tief — auf 1 Bildschirm-Ansicht (Desktop)».
    // Header & Zellen kompakter: Padding p-5/p-3.5 → p-3/p-2, Preis 1.85rem → 1.35rem,
    // Feature-Icons 6 → 5, kleinere Zeilen-Höhe. Spart ~40 % Höhe.
    <div className="max-w-5xl mx-auto rounded-card border border-stone bg-paper overflow-hidden">
      {/* ── Badge-Reihe (kompakt) ──────────────────────────────── */}
      <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] bg-cream/50 border-b border-stone">
        <div />
        {pakete.map((p) => {
          const badge = badgeFor(p);
          return (
            <div key={p.id} className="border-l border-stone h-7 flex items-center justify-center px-2 overflow-hidden">
              {badge && (
                <span className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-pill text-[10px] uppercase tracking-wider font-medium whitespace-nowrap',
                  badge.cls,
                )}>
                  {badge.label}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Header: Label + Preis (kompakt) ─────────────────────── */}
      <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] border-b border-stone">
        <div className="p-3">
          <p className="overline text-bronze-ink mb-1">Vergleich</p>
          <p className="text-[11px] text-muted leading-snug">
            {laufzeit === 12 ? '6-Mt-Standard, 12-Mt = −20 %' : '6-Mt-Standard'}
            {klein && <><br /><span className="text-bronze-ink">−25 % Klein-Inserat</span></>}
          </p>
        </div>
        {pakete.map((p) => {
          const isSelected = selectedId === p.id;
          const preis = klein ? p.preisKlein[laufzeit] : p.preis[laufzeit];
          const preisRegulaer = p.preis[laufzeit];
          const proMonat = preis / laufzeit;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              className={cn(
                'p-3 text-center border-l border-stone transition-all',
                isSelected ? 'bg-bronze/5' : 'bg-paper hover:bg-cream/40',
              )}
            >
              <p className={cn('overline mb-1.5', isSelected ? 'text-bronze-ink' : 'text-quiet')}>
                {p.label}
              </p>
              <p className="font-serif text-[1.35rem] text-navy font-light font-tabular leading-none">
                CHF {formatCHSwiss(preis)}
              </p>
              {klein && (
                <p className="font-mono text-[10px] line-through text-quiet mt-0.5">
                  CHF {formatCHSwiss(preisRegulaer)}
                </p>
              )}
              <p className="text-[10px] text-quiet mt-1">
                ≈ CHF {Math.round(proMonat).toLocaleString('de-CH')} / Mt
              </p>
            </button>
          );
        })}
      </div>

      {/* ── Feature-Zeilen (kompakt) ────────────────────────────── */}
      {FEATURES_VERGLEICH.map((row, i) => (
        <div
          key={row.key}
          className={cn(
            'grid grid-cols-[1.4fr_1fr_1fr_1fr]',
            i !== FEATURES_VERGLEICH.length - 1 && 'border-b border-stone/60',
            i % 2 === 1 && 'bg-cream/30',
          )}
        >
          <div className="px-3 py-2 text-[13px] leading-snug text-ink">{row.label}</div>
          {(['light', 'pro', 'premium'] as const).map((tier) => (
            <FeatureCell key={tier} value={row.values[tier]} highlighted={selectedId === tier} />
          ))}
        </div>
      ))}

      {/* ── Auswahl-Footer (kompakt) ────────────────────────────── */}
      <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] border-t border-stone bg-cream/40">
        <div />
        {pakete.map((p) => {
          const isSelected = selectedId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              className={cn(
                'py-2.5 px-2 border-l border-stone text-caption font-medium transition-all inline-flex items-center justify-center gap-1.5',
                isSelected
                  ? 'bg-bronze text-cream'
                  : 'text-navy hover:bg-bronze/10',
              )}
            >
              {isSelected ? (
                <>
                  <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                  Ausgewählt
                </>
              ) : (
                'Auswählen'
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FeatureCell({ value, highlighted }: { value: boolean | string; highlighted: boolean }) {
  let content: React.ReactNode;
  if (value === true) {
    content = (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-success/15 text-success">
        <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
      </span>
    );
  } else if (value === false) {
    content = (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-danger/10 text-danger">
        <span className="text-sm leading-none font-bold">×</span>
      </span>
    );
  } else {
    content = (
      <span className="inline-flex items-center px-2 py-0.5 rounded-pill bg-success/10 text-success text-[11px] font-mono font-medium whitespace-nowrap">
        ✓ {value}
      </span>
    );
  }
  return (
    <div className={cn(
      'px-2 py-2 border-l border-stone flex items-center justify-center transition-colors',
      highlighted && 'bg-bronze/5',
    )}>
      {content}
    </div>
  );
}
