'use client';

import * as React from 'react';
import { ArrowRight, ArrowLeft, RotateCcw, CheckCircle2, AlertCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { formatCHF, formatCHFShort, type CalcResult } from './calc';

type Branche = {
  branche: string;
  ebitda_multiple_min: number;
  ebitda_multiple_max: number;
  quelle: string | null;
};

type Props = {
  branchen: Branche[];
  kantone: string[];
};

type FormState = {
  branche: string;
  mitarbeitende: string;   // String wegen Input-Display
  umsatz_chf: string;
  ebitda_pct: string;
  kanton: string;
  wachstum_pct: string;
  email: string;
};

const STEPS = [
  { id: 'branche',       label: 'Branche' },
  { id: 'mitarbeitende', label: 'Mitarbeitende' },
  { id: 'umsatz',        label: 'Umsatz' },
  { id: 'ebitda',        label: 'EBITDA-Marge' },
  { id: 'standort',      label: 'Standort' },
  { id: 'wachstum',      label: 'Wachstum' },
  { id: 'ergebnis',      label: 'Ergebnis' },
] as const;

const initial: FormState = {
  branche: '',
  mitarbeitende: '',
  umsatz_chf: '',
  ebitda_pct: '',
  kanton: '',
  wachstum_pct: '5',
  email: '',
};

function formatThousands(s: string): string {
  const digits = s.replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('de-CH').replace(/,/g, "'");
}

function parseNumber(s: string): number {
  return Number(s.replace(/[^\d.-]/g, '')) || 0;
}

export default function BewertungsWizard({ branchen, kantone }: Props) {
  const [step, setStep] = React.useState(0);
  const [form, setForm] = React.useState<FormState>(initial);
  const [result, setResult] = React.useState<CalcResult | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [emailSent, setEmailSent] = React.useState(false);

  const isStepValid = React.useMemo(() => {
    switch (STEPS[step].id) {
      case 'branche':       return form.branche !== '';
      case 'mitarbeitende': return parseNumber(form.mitarbeitende) > 0;
      case 'umsatz':        return parseNumber(form.umsatz_chf) > 0;
      case 'ebitda':        return form.ebitda_pct !== '' && Number(form.ebitda_pct) >= -50 && Number(form.ebitda_pct) <= 80;
      case 'standort':      return form.kanton !== '';
      case 'wachstum':      return form.wachstum_pct !== '';
      default:              return true;
    }
  }, [step, form]);

  const next = async () => {
    setError(null);
    if (step < STEPS.length - 2) {
      setStep((s) => s + 1);
      return;
    }
    // Letzter Input-Step: berechnen
    setSubmitting(true);
    try {
      const res = await fetch('/api/bewertung', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branche: form.branche,
          mitarbeitende: parseNumber(form.mitarbeitende),
          umsatz_chf: parseNumber(form.umsatz_chf),
          ebitda_pct: Number(form.ebitda_pct),
          kanton: form.kanton,
          wachstum_pct: Number(form.wachstum_pct),
          email: null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Berechnung fehlgeschlagen');
      setResult(json.result);
      setStep(STEPS.length - 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler');
    } finally {
      setSubmitting(false);
    }
  };

  const sendEmail = async () => {
    if (!form.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      setError('Bitte eine gültige Email-Adresse eingeben.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await fetch('/api/bewertung', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branche: form.branche,
          mitarbeitende: parseNumber(form.mitarbeitende),
          umsatz_chf: parseNumber(form.umsatz_chf),
          ebitda_pct: Number(form.ebitda_pct),
          kanton: form.kanton,
          wachstum_pct: Number(form.wachstum_pct),
          email: form.email,
        }),
      });
      setEmailSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setForm(initial);
    setStep(0);
    setResult(null);
    setError(null);
    setEmailSent(false);
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div className="bg-paper border border-stone rounded-card overflow-hidden">
      {/* Step-Indikator */}
      <div className="border-b border-stone bg-cream/40 px-6 py-4 flex items-center gap-2 overflow-x-auto">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[11px] ${
                  i < step
                    ? 'bg-bronze text-cream'
                    : i === step
                    ? 'bg-navy text-cream'
                    : 'bg-stone text-quiet'
                }`}
              >
                {i + 1}
              </span>
              <span className={`font-mono text-[10px] uppercase tracking-widest hidden md:inline ${i === step ? 'text-navy' : 'text-quiet'}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && <span className="w-4 h-px bg-stone" />}
          </React.Fragment>
        ))}
      </div>

      <div className="p-8 md:p-12 min-h-[420px]">
        {/* Step-Content */}
        {STEPS[step].id === 'branche' && (
          <Step
            ueberline="Schritt 1 / 6"
            frage="In welcher Branche ist Ihre Firma tätig?"
            hinweis="Wählen Sie die nächstliegende Branche. Die Multiples sind aus Schweizer M&A-Reports 2025."
          >
            <div className="grid sm:grid-cols-2 gap-3">
              {branchen.map((b) => (
                <button
                  key={b.branche}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, branche: b.branche }))}
                  className={`text-left p-4 rounded-soft border transition-all ${
                    form.branche === b.branche
                      ? 'border-bronze bg-bronze/5 shadow-focus'
                      : 'border-stone hover:border-bronze/50 bg-cream/40'
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-3 mb-1">
                    <span className="font-serif text-[16px] text-navy">{b.branche}</span>
                    <span className="font-mono text-[11px] text-bronze-ink whitespace-nowrap">
                      {b.ebitda_multiple_min}× – {b.ebitda_multiple_max}×
                    </span>
                  </div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-quiet">EBITDA-Multiple</p>
                </button>
              ))}
            </div>
          </Step>
        )}

        {STEPS[step].id === 'mitarbeitende' && (
          <Step ueberline="Schritt 2 / 6" frage="Wie viele Mitarbeitende beschäftigen Sie?" hinweis="Vollzeit-Äquivalente (FTE).">
            <Label htmlFor="ma">Mitarbeitende</Label>
            <Input
              id="ma"
              type="number"
              min={0}
              max={5000}
              inputMode="numeric"
              autoFocus
              value={form.mitarbeitende}
              onChange={(e) => setForm((f) => ({ ...f, mitarbeitende: e.target.value }))}
              placeholder="z.B. 25"
            />
          </Step>
        )}

        {STEPS[step].id === 'umsatz' && (
          <Step ueberline="Schritt 3 / 6" frage="Wie hoch ist der Jahresumsatz?" hinweis="Letzter abgeschlossener Geschäftsjahr-Umsatz in CHF.">
            <Label htmlFor="umsatz">Umsatz (CHF)</Label>
            <Input
              id="umsatz"
              type="text"
              inputMode="numeric"
              autoFocus
              value={form.umsatz_chf}
              onChange={(e) => setForm((f) => ({ ...f, umsatz_chf: formatThousands(e.target.value) }))}
              placeholder="z.B. 8'400'000"
            />
          </Step>
        )}

        {STEPS[step].id === 'ebitda' && (
          <Step ueberline="Schritt 4 / 6" frage="Wie hoch ist die EBITDA-Marge?" hinweis="EBITDA in Prozent vom Umsatz. Standard CH-KMU: 8 – 20 %.">
            <Label htmlFor="ebitda">EBITDA-Marge (%)</Label>
            <Input
              id="ebitda"
              type="number"
              min={-50}
              max={80}
              step={0.5}
              inputMode="decimal"
              autoFocus
              value={form.ebitda_pct}
              onChange={(e) => setForm((f) => ({ ...f, ebitda_pct: e.target.value }))}
              placeholder="z.B. 18"
            />
          </Step>
        )}

        {STEPS[step].id === 'standort' && (
          <Step ueberline="Schritt 5 / 6" frage="In welchem Kanton ist Ihr Sitz?" hinweis="Beeinflusst Bewertung indirekt (Käufer-Reichweite, Steuerlast).">
            <Label htmlFor="kanton">Kanton</Label>
            <select
              id="kanton"
              value={form.kanton}
              onChange={(e) => setForm((f) => ({ ...f, kanton: e.target.value }))}
              className="w-full bg-paper border border-stone rounded-soft px-4 py-3 text-body font-sans text-ink focus:outline-none focus:border-bronze focus:shadow-focus"
            >
              <option value="">— wählen —</option>
              {kantone.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </Step>
        )}

        {STEPS[step].id === 'wachstum' && (
          <Step ueberline="Schritt 6 / 6" frage="Wie wächst die Firma jährlich?" hinweis="Durchschnitt der letzten 3 Jahre, in Prozent. Minus für rückläufig.">
            <Label htmlFor="wachstum">Wachstum p.a. (%)</Label>
            <Input
              id="wachstum"
              type="number"
              min={-50}
              max={200}
              step={0.5}
              inputMode="decimal"
              autoFocus
              value={form.wachstum_pct}
              onChange={(e) => setForm((f) => ({ ...f, wachstum_pct: e.target.value }))}
              placeholder="z.B. 5"
            />
            <p className="mt-3 font-mono text-[11px] text-quiet">
              {Number(form.wachstum_pct) >= 10 && '↑ Über 10 % p.a. — Bewertungs-Aufschlag.'}
              {Number(form.wachstum_pct) < 0 && '↓ Rückläufig — Bewertungs-Abschlag.'}
              {Number(form.wachstum_pct) >= 0 && Number(form.wachstum_pct) < 10 && '→ Stabiles Wachstum — neutraler Faktor.'}
            </p>
          </Step>
        )}

        {STEPS[step].id === 'ergebnis' && result && (
          <ResultStep
            result={result}
            form={form}
            onEmail={(e) => setForm((f) => ({ ...f, email: e }))}
            email={form.email}
            sendEmail={sendEmail}
            submitting={submitting}
            emailSent={emailSent}
            onReset={reset}
          />
        )}

        {error && (
          <div className="mt-6 flex items-start gap-2 text-danger text-[13px] font-sans">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Footer mit Buttons */}
      {STEPS[step].id !== 'ergebnis' && (
        <div className="border-t border-stone bg-cream/40 px-6 py-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={back}
            disabled={step === 0}
            className="inline-flex items-center gap-2 text-body-sm text-muted hover:text-navy disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            Zurück
          </button>
          <Button onClick={next} disabled={!isStepValid || submitting} size="md">
            {submitting
              ? 'Berechne …'
              : step === STEPS.length - 2
              ? 'Bewertung berechnen'
              : 'Weiter'}{' '}
            <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
          </Button>
        </div>
      )}
    </div>
  );
}

function Step({
  ueberline,
  frage,
  hinweis,
  children,
}: {
  ueberline: string;
  frage: string;
  hinweis: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="overline mb-4 text-bronze-ink">{ueberline}</p>
      <h3 className="font-serif text-head-lg md:text-head-lg text-navy font-normal mb-3 leading-snug">{frage}</h3>
      <p className="text-body-sm text-muted mb-8 max-w-prose">{hinweis}</p>
      <div className="max-w-md">{children}</div>
    </div>
  );
}

function ResultStep({
  result,
  form,
  email,
  onEmail,
  sendEmail,
  submitting,
  emailSent,
  onReset,
}: {
  result: CalcResult;
  form: FormState;
  email: string;
  onEmail: (e: string) => void;
  sendEmail: () => void;
  submitting: boolean;
  emailSent: boolean;
  onReset: () => void;
}) {
  return (
    <div>
      <p className="overline mb-4 text-bronze-ink">Ihre Bewertung</p>
      <h3 className="font-serif text-head-lg text-navy font-normal mb-2 leading-snug">
        Indikativer Marktwert
      </h3>
      <p className="text-body-sm text-muted mb-8">
        Basierend auf {form.branche}-Multiples ({result.multiple_min_used}× – {result.multiple_max_used}× EBITDA),
        Wachstums-Faktor ×{result.growth_factor.toFixed(2)}.
      </p>

      <div className="grid md:grid-cols-2 gap-px bg-stone border border-stone rounded-card overflow-hidden mb-8">
        <div className="bg-cream/40 p-8">
          <p className="font-mono text-[11px] uppercase tracking-widest text-quiet mb-2">Untere Range</p>
          <p className="font-serif text-[clamp(2rem,4vw,3rem)] text-navy font-light leading-none font-tabular">
            {formatCHFShort(result.marktwert_min)}
          </p>
          <p className="font-mono text-[11px] text-quiet mt-2">{formatCHF(result.marktwert_min)}</p>
        </div>
        <div className="bg-bronze/5 p-8">
          <p className="font-mono text-[11px] uppercase tracking-widest text-bronze-ink mb-2">Obere Range</p>
          <p className="font-serif text-[clamp(2rem,4vw,3rem)] text-navy font-light leading-none font-tabular">
            {formatCHFShort(result.marktwert_max)}
          </p>
          <p className="font-mono text-[11px] text-quiet mt-2">{formatCHF(result.marktwert_max)}</p>
        </div>
      </div>

      <div className="space-y-3 mb-8 text-body-sm">
        <div className="flex justify-between items-center pb-3 border-b border-stone">
          <span className="text-muted">Ihr EBITDA</span>
          <span className="font-mono text-ink">{formatCHF(result.ebitda_chf)}</span>
        </div>
        <div className="flex justify-between items-center pb-3 border-b border-stone">
          <span className="text-muted">Quelle Multiples</span>
          <span className="font-mono text-[11px] text-quiet text-right max-w-[60%]">{result.quelle}</span>
        </div>
        <div className="flex justify-between items-center pb-3 border-b border-stone">
          <span className="text-muted">Standort</span>
          <span className="font-mono text-ink">{form.kanton}</span>
        </div>
      </div>

      {result.warning && (
        <div className="mb-8 p-4 bg-warn/5 border border-warn/20 rounded-soft flex items-start gap-2 text-[13px]">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-warn" strokeWidth={1.5} />
          <span className="text-muted">{result.warning}</span>
        </div>
      )}

      <p className="text-body-sm text-muted mb-8 max-w-prose">
        <strong className="text-ink">Hinweis:</strong> Diese Indikation ersetzt keine professionelle Bewertung.
        Persönliche Faktoren (Inhaber-Abhängigkeit, Klumpenrisiken, Substanz, Eigentümerstruktur) sind nicht berücksichtigt.
        Eine vollständige Bewertung übernimmt unser Treuhand-Netzwerk.
      </p>

      {/* PDF / Email-CTA */}
      <div className="bg-navy text-cream rounded-card p-6 md:p-8 mb-6">
        <div className="flex items-start gap-3 mb-4">
          <Mail className="w-5 h-5 mt-0.5 flex-shrink-0 text-bronze" strokeWidth={1.5} />
          <div>
            <h4 className="font-serif text-head-md text-cream mb-1">Detail-Report per Email</h4>
            <p className="text-body-sm text-cream/75 leading-relaxed">
              Mit Branchen-Vergleich, Bewertungs-Faktoren und einem Beispiel-Inserat — kostenlos.
            </p>
          </div>
        </div>
        {emailSent ? (
          <div className="flex items-center gap-2 text-bronze">
            <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
            <span className="text-body-sm">Vielen Dank — der Report wird in Kürze versendet.</span>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => onEmail(e.target.value)}
              placeholder="ihre@firma.ch"
              className="flex-1 bg-cream/10 border border-cream/20 rounded-soft px-4 py-3 text-cream placeholder:text-cream/40 focus:outline-none focus:border-bronze"
            />
            <Button onClick={sendEmail} disabled={submitting || !email} variant="bronze" size="md">
              {submitting ? 'Sende …' : 'Report anfordern'} <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-start gap-4 justify-between">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 text-body-sm text-muted hover:text-navy"
        >
          <RotateCcw className="w-4 h-4" strokeWidth={1.5} />
          Neue Berechnung
        </button>
        <Button href="/verkaufen" variant="secondary" size="md">
          Inserat erstellen <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
        </Button>
      </div>
    </div>
  );
}
