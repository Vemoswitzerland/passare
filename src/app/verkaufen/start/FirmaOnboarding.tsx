'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2, Check, ArrowRight, ArrowLeft, Sparkles,
  TrendingUp, Users, Calendar, MapPin, Briefcase, Loader2,
  Info,
} from 'lucide-react';
import { FirmenSuche } from '@/components/zefix/FirmenSuche';
import { SmartPriceEstimate } from '@/components/valuation/SmartPriceEstimate';
import { BRANCHEN_LIST, matchBrancheFromPurpose } from '@/data/branchen-multiples';
import { formatCHF, formatCHFShort, type ValuationResult } from '@/lib/valuation';
import { cn } from '@/lib/utils';

const KANTONE: Array<[string, string]> = [
  ['ZH', 'Zürich'], ['BE', 'Bern'], ['LU', 'Luzern'], ['UR', 'Uri'], ['SZ', 'Schwyz'],
  ['OW', 'Obwalden'], ['NW', 'Nidwalden'], ['GL', 'Glarus'], ['ZG', 'Zug'], ['FR', 'Fribourg'],
  ['SO', 'Solothurn'], ['BS', 'Basel-Stadt'], ['BL', 'Basel-Landschaft'], ['SH', 'Schaffhausen'],
  ['AR', 'Appenzell A.Rh.'], ['AI', 'Appenzell I.Rh.'], ['SG', 'St. Gallen'],
  ['GR', 'Graubünden'], ['AG', 'Aargau'], ['TG', 'Thurgau'], ['TI', 'Ticino'],
  ['VD', 'Vaud'], ['VS', 'Valais'], ['NE', 'Neuchâtel'], ['GE', 'Genève'], ['JU', 'Jura'],
];

const MA_BUCKETS = [
  { id: '0-10', label: '< 10', min: 1, max: 10 },
  { id: '10-20', label: '10–20', min: 10, max: 20 },
  { id: '20-50', label: '20–50', min: 20, max: 50 },
  { id: '50-100', label: '50–100', min: 50, max: 100 },
  { id: '>100', label: '> 100', min: 100, max: 999 },
];

type Draft = {
  step: number;
  zefix_uid: string | null;
  firma_name: string | null;
  firma_rechtsform: string | null;
  firma_sitz_gemeinde: string | null;
  branche_id: string | null;
  kanton: string | null;
  jahr: number | null;
  mitarbeitende: number | null;
  umsatz: number | null;
  ebitda: number | null;
  valuation: ValuationResult | null;
};

const EMPTY: Draft = {
  step: 1, zefix_uid: null, firma_name: null, firma_rechtsform: null,
  firma_sitz_gemeinde: null, branche_id: null, kanton: null,
  jahr: null, mitarbeitende: null, umsatz: null, ebitda: null, valuation: null,
};

export function FirmaOnboarding() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [valuationLoading, setValuationLoading] = useState(false);

  // Resume aus Cookie
  useEffect(() => {
    fetch('/api/pre-reg').then(r => r.json()).then(({ data }) => {
      if (data && typeof data === 'object') setDraft({ ...EMPTY, ...data });
    }).catch(() => {});
  }, []);

  // Auto-Save bei jeder Änderung (debounced)
  useEffect(() => {
    if (draft === EMPTY) return;
    const t = window.setTimeout(() => {
      fetch('/api/pre-reg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      }).catch(() => {});
    }, 800);
    return () => window.clearTimeout(t);
  }, [draft]);

  const update = (patch: Partial<Draft>) => setDraft(d => ({ ...d, ...patch }));
  const next = () => setDraft(d => ({ ...d, step: Math.min(d.step + 1, 5) }));
  const prev = () => setDraft(d => ({ ...d, step: Math.max(d.step - 1, 1) }));

  // Bei Step 4: Bewertung berechnen
  useEffect(() => {
    if (draft.step !== 4) return;
    if (draft.valuation) return;
    if (!draft.branche_id || !draft.umsatz || !draft.ebitda) return;

    setValuationLoading(true);
    fetch('/api/valuation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        branche_id: draft.branche_id,
        umsatz: draft.umsatz,
        ebitda: draft.ebitda,
        mitarbeitende: draft.mitarbeitende,
        jahr: draft.jahr,
      }),
    })
      .then(r => r.json())
      .then((res: ValuationResult) => {
        update({ valuation: res });
      })
      .catch(() => {})
      .finally(() => setValuationLoading(false));
  }, [draft.step, draft.valuation, draft.branche_id, draft.umsatz, draft.ebitda, draft.mitarbeitende, draft.jahr]);

  // Step-Validation
  const canNext = (() => {
    if (draft.step === 1) return Boolean(draft.zefix_uid || draft.firma_name);
    if (draft.step === 2) return Boolean(draft.branche_id && draft.kanton);
    if (draft.step === 3)
      return draft.umsatz != null && draft.umsatz > 0
        && draft.ebitda != null
        && draft.mitarbeitende != null && draft.mitarbeitende > 0
        && draft.jahr != null;
    if (draft.step === 4) return Boolean(draft.valuation);
    return true;
  })();

  return (
    <div className="space-y-10">
      <ProgressBar step={draft.step} />

      <div>
        {draft.step === 1 && <Step1Firma draft={draft} update={update} />}
        {draft.step === 2 && <Step2Branche draft={draft} update={update} />}
        {draft.step === 3 && <Step3Finanzen draft={draft} update={update} />}
        {draft.step === 4 && (
          <Step4Bewertung draft={draft} loading={valuationLoading} />
        )}
        {draft.step === 5 && <Step5Account draft={draft} router={router} startTransition={startTransition} />}
      </div>

      {draft.step < 5 && (
        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={prev}
            disabled={draft.step === 1}
            className="inline-flex items-center gap-2 text-body-sm text-muted hover:text-navy disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            Zurück
          </button>

          <button
            type="button"
            onClick={next}
            disabled={!canNext}
            className={cn(
              'inline-flex items-center gap-2 px-6 py-3 rounded-soft text-body-sm font-medium transition-all',
              canNext
                ? 'bg-navy text-cream hover:bg-ink shadow-card hover:shadow-lift hover:-translate-y-px'
                : 'bg-stone text-quiet cursor-not-allowed',
            )}
          >
            {draft.step === 4 ? 'Account erstellen' : 'Weiter'}
            <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────────── PROGRESS-BAR ─────────── */
function ProgressBar({ step }: { step: number }) {
  const steps = ['Firma', 'Branche', 'Finanzen', 'Bewertung', 'Account'];
  return (
    <div className="flex items-center gap-2 md:gap-3">
      {steps.map((label, i) => {
        const idx = i + 1;
        const done = step > idx;
        const active = step === idx;
        return (
          <div key={label} className="flex items-center gap-2 md:gap-3 flex-1 last:flex-initial">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-caption font-mono font-medium flex-shrink-0 transition-all',
                  done
                    ? 'bg-bronze text-cream'
                    : active
                      ? 'bg-navy text-cream ring-4 ring-navy/10'
                      : 'bg-stone text-quiet',
                )}
              >
                {done ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : idx}
              </div>
              <span
                className={cn(
                  'text-caption hidden md:inline transition-colors',
                  active ? 'text-navy font-medium' : done ? 'text-bronze-ink' : 'text-quiet',
                )}
              >
                {label}
              </span>
            </div>
            {idx < steps.length && (
              <div
                className={cn(
                  'flex-1 h-px transition-colors',
                  done ? 'bg-bronze/60' : 'bg-stone',
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────── STEP 1: FIRMA ─────────── */
function Step1Firma({ draft, update }: { draft: Draft; update: (p: Partial<Draft>) => void }) {
  const [enriching, setEnriching] = useState(false);
  const [manual, setManual] = useState(false);

  /**
   * UX-Flow:
   * 1. Click auf Search-Hit → SOFORT alle Basisdaten in den Draft
   *    (uid, name, ort, kanton). Card erscheint, "Weiter" wird aktiv.
   * 2. Detail-Lookup läuft im HINTERGRUND — KEINE blockierende UI.
   *    User kann jederzeit "Weiter" klicken; falls Lookup-Daten
   *    bis dahin da sind, werden sie automatisch genutzt.
   * 3. Wenn Lookup mit Branche/Rechtsform/Jahr zurückkommt: silent
   *    merge in Draft. Ein dezenter "✨ noch mehr Details geladen"-
   *    Hinweis wird kurz angezeigt.
   */
  function selectByHit(hit: { uid: string | null; name: string | null; ort: string | null; kanton: string | null }) {
    update({
      zefix_uid: hit.uid,
      firma_name: hit.name,
      firma_sitz_gemeinde: hit.ort,
      kanton: hit.kanton,
    });

    if (!hit.uid) return;

    // Hintergrund-Enrichment — OHNE await, blockiert nichts
    setEnriching(true);
    void fetchAndMergeDetails(hit.uid).finally(() => setEnriching(false));
  }

  async function fetchAndMergeDetails(uid: string) {
    try {
      // Erste Anfrage — wenn 200 mit company → fertig.
      // Wenn 202/pending → wir warten EINMAL kurz und versuchen es nochmal.
      // Mehr nicht — User soll nicht 36s warten.
      const company = await tryLookup(uid);
      if (!company) return;

      const matchedBranche = matchBrancheFromPurpose(company.branche ?? company.zweck);
      update({
        firma_rechtsform: company.rechtsform ?? null,
        firma_sitz_gemeinde: company.gemeinde ?? company.adresse?.ort ?? undefined,
        branche_id: matchedBranche,
        kanton: company.kanton ?? undefined,
        jahr: company.gruendungsjahr ?? null,
      });
    } catch {
      // Silent fail — Basisdaten reichen
    }
  }

  async function tryLookup(uid: string): Promise<any | null> {
    // Erster Versuch
    const res1 = await fetch(`/api/zefix/lookup?uid=${encodeURIComponent(uid)}`);
    if (res1.ok) {
      const data = await res1.json();
      if (data.company) return data.company;
      if (data.status === 'pending') {
        // EIN Retry nach 8s — länger nicht, sonst frustrierend
        await new Promise((r) => setTimeout(r, 8000));
        const res2 = await fetch(`/api/zefix/lookup?uid=${encodeURIComponent(uid)}`);
        if (res2.ok) {
          const data2 = await res2.json();
          if (data2.company) return data2.company;
        }
      }
    }
    return null;
  }

  return (
    <div className="space-y-8 animate-fade-up">
      <div className="text-center">
        <p className="overline mb-4 text-bronze-ink">Schritt 1 von 5</p>
        <h1 className="font-serif text-display-sm text-navy font-light mb-3 tracking-tight">
          Welche Firma möchtest du verkaufen?
        </h1>
        <p className="text-body-lg text-muted max-w-prose mx-auto">
          Wir suchen dir die Daten direkt aus dem Schweizer Handelsregister — keine doppelte Tipperei.
        </p>
      </div>

      {!manual ? (
        <>
          <FirmenSuche onSelect={selectByHit} />
          <div className="text-center">
            <button
              type="button"
              onClick={() => setManual(true)}
              className="text-body-sm text-bronze-ink hover:text-bronze underline-offset-4 hover:underline"
            >
              Firma nicht auffindbar? Manuell eintragen →
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-4 max-w-xl mx-auto">
          <Field label="Firmenname (intern, nie öffentlich)">
            <input
              type="text"
              value={draft.firma_name ?? ''}
              onChange={(e) => update({ firma_name: e.target.value })}
              placeholder="Mustermann AG"
              className="w-full px-4 py-3 bg-paper border border-stone rounded-soft text-body focus:outline-none focus:border-bronze focus:shadow-focus transition-all"
            />
          </Field>
          <Field label="Rechtsform" optional>
            <input
              type="text"
              value={draft.firma_rechtsform ?? ''}
              onChange={(e) => update({ firma_rechtsform: e.target.value })}
              placeholder="z. B. AG, GmbH, Einzelunternehmen"
              className="w-full px-4 py-3 bg-paper border border-stone rounded-soft text-body focus:outline-none focus:border-bronze focus:shadow-focus transition-all"
            />
          </Field>
          <button
            type="button"
            onClick={() => setManual(false)}
            className="text-body-sm text-quiet hover:text-navy"
          >
            ← Zurück zur Suche
          </button>
        </div>
      )}

      {draft.firma_name && (
        <div className="rounded-card bg-bronze/5 border border-bronze/30 p-6 max-w-xl mx-auto animate-fade-up">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-soft bg-bronze/15 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-bronze-ink" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body text-navy font-medium">{draft.firma_name}</p>
              <p className="text-caption text-muted font-mono mt-1 flex flex-wrap gap-x-3">
                {draft.zefix_uid && <span>{draft.zefix_uid}</span>}
                {draft.firma_rechtsform && <span>· {draft.firma_rechtsform}</span>}
                {draft.firma_sitz_gemeinde && (
                  <span className="inline-flex items-center gap-1">
                    · <MapPin className="w-3 h-3" strokeWidth={1.5} /> {draft.firma_sitz_gemeinde}
                  </span>
                )}
              </p>
              <p className="text-caption text-success mt-2 inline-flex items-center gap-1">
                <Check className="w-3 h-3" strokeWidth={2.5} /> Daten übernommen — du kannst weiter
              </p>
              {enriching && (
                <p className="text-caption text-quiet mt-1.5 inline-flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin text-bronze" strokeWidth={1.5} />
                  Wir holen im Hintergrund noch Branche & Gründungsjahr …
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────── STEP 2: BRANCHE & STANDORT ─────────── */
function Step2Branche({ draft, update }: { draft: Draft; update: (p: Partial<Draft>) => void }) {
  return (
    <div className="space-y-10 animate-fade-up">
      <div className="text-center">
        <p className="overline mb-4 text-bronze-ink">Schritt 2 von 5</p>
        <h1 className="font-serif text-display-sm text-navy font-light mb-3 tracking-tight">
          Branche & Standort bestätigen
        </h1>
        <p className="text-body-lg text-muted max-w-prose mx-auto">
          Wir haben Vorschläge aus deinen Firmendaten — du kannst alles anpassen.
        </p>
      </div>

      <div className="space-y-8 max-w-xl mx-auto">
        <Field label="Branche">
          <div className="grid grid-cols-2 gap-2">
            {BRANCHEN_LIST.map((b) => {
              const selected = draft.branche_id === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => update({ branche_id: b.id })}
                  className={cn(
                    'px-3 py-2.5 text-left rounded-soft border text-body-sm transition-all',
                    selected
                      ? 'border-bronze bg-bronze/10 text-navy font-medium shadow-subtle'
                      : 'border-stone bg-paper hover:border-bronze/40 hover:bg-bronze/5 text-ink',
                  )}
                >
                  {b.label}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Kanton">
          <select
            value={draft.kanton ?? ''}
            onChange={(e) => update({ kanton: e.target.value })}
            className="w-full px-4 py-3 bg-paper border border-stone rounded-soft text-body text-ink focus:outline-none focus:border-bronze focus:shadow-focus transition-all"
          >
            <option value="">Wähle Kanton …</option>
            {KANTONE.map(([code, label]) => (
              <option key={code} value={code}>
                {label} ({code})
              </option>
            ))}
          </select>
        </Field>
      </div>
    </div>
  );
}

/* ─────────── STEP 3: FINANZEN ─────────── */
function Step3Finanzen({ draft, update }: { draft: Draft; update: (p: Partial<Draft>) => void }) {
  const [margeMode, setMargeMode] = useState<'chf' | 'pct'>('chf');
  const margePct =
    draft.ebitda != null && draft.umsatz != null && draft.umsatz > 0
      ? (draft.ebitda / draft.umsatz) * 100
      : 0;

  function setMargePct(pct: number) {
    if (draft.umsatz != null && draft.umsatz > 0) {
      update({ ebitda: Math.round((pct / 100) * draft.umsatz) });
    }
  }

  // Peer-Comparison-Hint
  const peerHint = (() => {
    if (!margePct) return null;
    if (margePct > 18) return '🎯 Top-Quartil deiner Grössenklasse';
    if (margePct > 10) return '📈 Über CH-KMU-Median';
    if (margePct > 5) return '↘ Unter CH-KMU-Median';
    return '⚠ Sehr dünne Marge — Käufer fragen nach Wachstumshebel';
  })();

  return (
    <div className="space-y-10 animate-fade-up">
      <div className="text-center">
        <p className="overline mb-4 text-bronze-ink">Schritt 3 von 5</p>
        <h1 className="font-serif text-display-sm text-navy font-light mb-3 tracking-tight">
          Finanzdaten
        </h1>
        <p className="text-body-lg text-muted max-w-prose mx-auto">
          Deine Zahlen bleiben anonym — werden nur für die Bewertung benötigt.
        </p>
      </div>

      <div className="space-y-8 max-w-xl mx-auto">
        <Field label="Jahresumsatz" hint={draft.umsatz ? formatCHF(draft.umsatz) : undefined}>
          <input
            type="range"
            min={100000}
            max={50000000}
            step={50000}
            value={draft.umsatz ?? 1000000}
            onChange={(e) => update({ umsatz: Number(e.target.value) })}
            className="w-full accent-bronze"
          />
          <CurrencyInput
            value={draft.umsatz}
            onChange={(v) => update({ umsatz: v })}
            placeholder="2'000'000"
            className="mt-2"
          />
          <p className="mt-2 text-caption text-quiet">
            Brutto-Erlöse aus dem letzten abgeschlossenen Geschäftsjahr.
          </p>
        </Field>

        <Field
          label={
            <span className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5">
                EBITDA
                <InfoPop>
                  <strong className="block text-navy mb-1">EBITDA</strong>
                  <span className="block text-muted">
                    «Earnings Before Interest, Taxes, Depreciation & Amortization» — der
                    operative Gewinn <strong>vor</strong> Zinsen, Steuern und Abschreibungen.
                  </span>
                  <span className="block mt-2 text-quiet">
                    Faustformel: Reingewinn + Zinsaufwand + Steuern + Abschreibungen.
                  </span>
                  <span className="block mt-2 text-quiet italic">
                    Käufer bewerten KMU primär als Vielfaches des EBITDA.
                  </span>
                </InfoPop>
              </span>
              <span className="inline-flex bg-stone/40 rounded-soft p-0.5">
                <button
                  type="button"
                  onClick={() => setMargeMode('chf')}
                  className={cn(
                    'px-2 py-0.5 rounded-soft text-caption transition-colors',
                    margeMode === 'chf' ? 'bg-paper text-navy shadow-subtle' : 'text-quiet',
                  )}
                >
                  CHF
                </button>
                <button
                  type="button"
                  onClick={() => setMargeMode('pct')}
                  className={cn(
                    'px-2 py-0.5 rounded-soft text-caption transition-colors',
                    margeMode === 'pct' ? 'bg-paper text-navy shadow-subtle' : 'text-quiet',
                  )}
                >
                  %
                </button>
              </span>
            </span>
          }
          hint={
            draft.ebitda != null && draft.umsatz != null
              ? `${formatCHFShort(draft.ebitda)} · ${margePct.toFixed(1)}% Marge`
              : undefined
          }
        >
          {margeMode === 'chf' ? (
            <CurrencyInput
              value={draft.ebitda}
              onChange={(v) => update({ ebitda: v })}
              placeholder="350'000"
            />
          ) : (
            <input
              type="range"
              min={0}
              max={40}
              step={0.5}
              value={margePct}
              onChange={(e) => setMargePct(Number(e.target.value))}
              className="w-full accent-bronze"
            />
          )}
          {peerHint && (
            <p className="mt-2 text-caption text-bronze-ink">{peerHint}</p>
          )}
        </Field>

        <Field label="Mitarbeitende (FTE)" hint={draft.mitarbeitende ? `${draft.mitarbeitende} Personen` : undefined}>
          <div className="flex flex-wrap gap-2 mb-2">
            {MA_BUCKETS.map((b) => {
              const selected =
                draft.mitarbeitende != null &&
                draft.mitarbeitende >= b.min &&
                draft.mitarbeitende < b.max;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => update({ mitarbeitende: Math.round((b.min + Math.min(b.max, 999)) / 2) })}
                  className={cn(
                    'px-4 py-2 rounded-pill border text-caption transition-all',
                    selected
                      ? 'border-bronze bg-bronze/10 text-navy font-medium'
                      : 'border-stone bg-paper hover:border-bronze/40 text-ink',
                  )}
                >
                  {b.label}
                </button>
              );
            })}
          </div>
          <input
            type="text"
            inputMode="numeric"
            value={draft.mitarbeitende ?? ''}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9]/g, '');
              update({ mitarbeitende: v ? Number(v) : null });
            }}
            placeholder="20"
            className="w-full px-4 py-3 bg-paper border border-stone rounded-soft text-body font-mono focus:outline-none focus:border-bronze focus:shadow-focus transition-all"
          />
        </Field>

        <Field label="Gründungsjahr">
          <input
            type="text"
            inputMode="numeric"
            value={draft.jahr ?? ''}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
              update({ jahr: v ? Number(v) : null });
            }}
            placeholder="1987"
            className="w-full px-4 py-3 bg-paper border border-stone rounded-soft text-body font-mono focus:outline-none focus:border-bronze focus:shadow-focus transition-all"
          />
        </Field>
      </div>
    </div>
  );
}

/* ─────────── STEP 4: BEWERTUNG ─────────── */
function Step4Bewertung({
  draft, loading,
}: { draft: Draft; loading: boolean }) {
  return (
    <div className="space-y-8 animate-fade-up">
      <div className="text-center">
        <p className="overline mb-4 text-bronze-ink">Schritt 4 von 5</p>
        <h1 className="font-serif text-display-sm text-navy font-light mb-3 tracking-tight">
          Deine Smart-Bewertung
        </h1>
        <p className="text-body-lg text-muted max-w-prose mx-auto">
          Indikativer Marktwert basierend auf 7 Faktoren — in 1.5 Sekunden berechnet.
        </p>
      </div>

      <SmartPriceEstimate result={draft.valuation} loading={loading} />

      {draft.valuation && !loading && (
        <div className="text-center text-caption text-muted">
          <Sparkles className="w-3.5 h-3.5 inline-block text-bronze mr-1" strokeWidth={1.5} />
          Klicke <strong className="text-navy">«Account erstellen»</strong> um dein Inserat zu starten.
        </div>
      )}
    </div>
  );
}

/* ─────────── STEP 5: ACCOUNT REDIRECT ─────────── */
function Step5Account({
  draft, router, startTransition,
}: { draft: Draft; router: ReturnType<typeof useRouter>; startTransition: (cb: () => void) => void }) {
  // Diese Step ist faktisch nur Übergangs-Animation: speichert Draft + redirected zu /auth/register
  useEffect(() => {
    fetch('/api/pre-reg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...draft, step: 5 }),
    }).then(() => {
      startTransition(() => {
        router.push('/auth/register?from=pre-reg');
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="text-center py-16 animate-fade-up">
      <Loader2 className="w-12 h-12 mx-auto text-bronze animate-spin mb-6" strokeWidth={1.5} />
      <h2 className="font-serif text-head-md text-navy mb-2">Wir bringen dich zur Registrierung …</h2>
      <p className="text-body text-muted">Deine Daten sind gespeichert und werden nach dem Login automatisch übernommen.</p>
    </div>
  );
}

/* ─────────── HELPERS ─────────── */
function Field({
  label, optional, hint, children,
}: {
  label: React.ReactNode;
  optional?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="overline text-bronze-ink mb-2 block flex items-center justify-between">
        <span>
          {label}
          {optional && <span className="ml-1 text-quiet normal-case tracking-normal text-caption italic">(optional)</span>}
        </span>
        {hint && <span className="text-caption font-mono text-bronze normal-case tracking-normal">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

/* ─────────── CURRENCY-INPUT (Schweizer Trennstriche '1'000'000') ─────────── */
function CurrencyInput({
  value, onChange, placeholder, className,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder?: string;
  className?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [raw, setRaw] = useState<string>(value != null ? String(value) : '');

  // Wenn parent-value sich extern ändert (z.B. via Range-Slider) → sync
  useEffect(() => {
    if (!focused) setRaw(value != null ? String(value) : '');
  }, [value, focused]);

  const formatted = (() => {
    if (focused) return raw;
    if (value == null) return '';
    return formatCHSwiss(value);
  })();

  return (
    <div className={cn('relative', className)}>
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-quiet font-mono text-body-sm pointer-events-none">
        CHF
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={formatted}
        onChange={(e) => {
          const cleaned = e.target.value.replace(/[^0-9]/g, '');
          setRaw(cleaned);
          onChange(cleaned ? Number(cleaned) : null);
        }}
        onFocus={() => {
          setFocused(true);
          setRaw(value != null ? String(value) : '');
        }}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="w-full pl-14 pr-4 py-3 bg-paper border border-stone rounded-soft text-body font-mono tabular-nums focus:outline-none focus:border-bronze focus:shadow-focus transition-all"
      />
    </div>
  );
}

function formatCHSwiss(n: number): string {
  // Schweizer Trennzeichen: Apostroph (1'000'000)
  if (!Number.isFinite(n)) return '';
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
}

/* ─────────── INFO-POP (kleines i-Icon mit Click-Tooltip) ─────────── */
function InfoPop({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <span ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label="Info"
        aria-expanded={open}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-quiet hover:text-bronze-ink transition-colors"
      >
        <Info className="w-3.5 h-3.5" strokeWidth={1.75} />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 w-72 px-4 py-3 bg-paper border border-stone rounded-card shadow-lift text-body-sm text-ink leading-relaxed normal-case tracking-normal animate-fade-up"
          style={{ animationDuration: '200ms' }}
          onClick={(e) => e.stopPropagation()}
        >
          <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-paper border-l border-t border-stone rotate-45" />
          <span className="relative block">{children}</span>
        </span>
      )}
    </span>
  );
}
