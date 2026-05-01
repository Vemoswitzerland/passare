'use client';

import { useActionState, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Briefcase, Search, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { completeOnboardingAction } from '../auth/actions';
import type { ActionResult } from '../auth/constants';

type Rolle = 'verkaeufer' | 'kaeufer';

type Props = {
  defaultName: string;
  defaultSprache: 'de' | 'fr' | 'it' | 'en';
  kantone: ReadonlyArray<readonly [string, string]>;
};

const SPRACHEN: ReadonlyArray<readonly [string, string]> = [
  ['de', 'Deutsch'], ['fr', 'Français'], ['it', 'Italiano'], ['en', 'English'],
];

export function OnboardingWizard({ defaultName, defaultSprache, kantone }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [rolle, setRolle] = useState<Rolle | null>(null);
  const [fullName, setFullName] = useState(defaultName);
  const [kanton, setKanton] = useState('');
  const [sprache, setSprache] = useState<Props['defaultSprache']>(defaultSprache);
  const [acceptAgb, setAcceptAgb] = useState(false);
  const [acceptDs, setAcceptDs] = useState(false);
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    completeOnboardingAction,
    null,
  );

  const canStep2 = rolle !== null;
  const canStep3 = canStep2 && fullName.trim().length >= 2 && kanton.length === 2;
  const canSubmit = canStep3 && acceptAgb && acceptDs && !pending;

  return (
    <div>
      <ProgressBar step={step} />

      {step === 1 && (
        <StepRolle
          rolle={rolle}
          onChange={setRolle}
          onNext={() => canStep2 && setStep(2)}
          canNext={canStep2}
        />
      )}

      {step === 2 && (
        <StepProfil
          fullName={fullName}
          kanton={kanton}
          sprache={sprache}
          kantone={kantone}
          onName={setFullName}
          onKanton={setKanton}
          onSprache={setSprache}
          onBack={() => setStep(1)}
          onNext={() => canStep3 && setStep(3)}
          canNext={canStep3}
        />
      )}

      {step === 3 && (
        <form action={action}>
          {/* hidden state passes everything to server-action */}
          <input type="hidden" name="rolle" value={rolle ?? ''} />
          <input type="hidden" name="full_name" value={fullName} />
          <input type="hidden" name="kanton" value={kanton} />
          <input type="hidden" name="sprache" value={sprache} />

          <StepBestaetigen
            rolle={rolle as Rolle}
            fullName={fullName}
            kanton={kantone.find(([c]) => c === kanton)?.[1] ?? kanton}
            sprache={SPRACHEN.find(([c]) => c === sprache)?.[1] ?? sprache}
            acceptAgb={acceptAgb}
            acceptDs={acceptDs}
            onAcceptAgb={setAcceptAgb}
            onAcceptDs={setAcceptDs}
            onBack={() => setStep(2)}
            canSubmit={canSubmit}
            pending={pending}
            error={state && !state.ok ? state.error : null}
          />
        </form>
      )}
    </div>
  );
}

/* ────────────────── Progress Bar ────────────────── */
function ProgressBar({ step }: { step: 1 | 2 | 3 }) {
  const steps = ['Rolle', 'Profil', 'Bestätigen'];
  return (
    <ol className="flex items-center justify-between mb-10 font-mono text-[10px] uppercase tracking-widest text-quiet">
      {steps.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        const done = step > n;
        const active = step === n;
        return (
          <li key={label} className="flex items-center gap-2 flex-1">
            <span
              className={`flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-[11px] ${
                done
                  ? 'border-success bg-success/15 text-success'
                  : active
                    ? 'border-bronze bg-bronze/10 text-bronze'
                    : 'border-stone bg-paper text-quiet'
              }`}
            >
              {done ? <Check className="w-3 h-3" strokeWidth={2} /> : n}
            </span>
            <span className={active || done ? 'text-ink' : ''}>{label}</span>
            {n < 3 && (
              <span
                className={`flex-1 h-px ${done ? 'bg-success/40' : 'bg-stone'} mx-2`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/* ────────────────── Step 1: Rolle ────────────────── */
function StepRolle({
  rolle, onChange, onNext, canNext,
}: {
  rolle: Rolle | null;
  onChange: (r: Rolle) => void;
  onNext: () => void;
  canNext: boolean;
}) {
  return (
    <div>
      <p className="text-body text-muted leading-relaxed mb-8 text-center">
        Was möchtest du auf passare tun?
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        <RolleCard
          selected={rolle === 'verkaeufer'}
          onSelect={() => onChange('verkaeufer')}
          icon={<Briefcase className="w-7 h-7 text-bronze" strokeWidth={1.25} />}
          title="Ich verkaufe"
          subtitle="Mein Unternehmen anonym inserieren"
          bullets={[
            'Ab CHF 425, einmaliger Paketpreis',
            'Pauschalpreis — keine Folgekosten',
            'Detailfreigabe nur durch Sie selbst',
          ]}
        />
        <RolleCard
          selected={rolle === 'kaeufer'}
          onSelect={() => onChange('kaeufer')}
          icon={<Search className="w-7 h-7 text-bronze" strokeWidth={1.25} />}
          title="Ich kaufe"
          subtitle="Schweizer Firmen entdecken"
          bullets={[
            'Marktplatz-Zugang gratis (Basic)',
            'Käufer+-Abo für Frühzugang & alle Filter',
            'Anfrage in zwei Klicks',
          ]}
        />
      </div>

      <div className="flex justify-end">
        <Button
          onClick={onNext}
          disabled={!canNext}
          size="lg"
          className="disabled:opacity-40"
        >
          Weiter <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
        </Button>
      </div>
    </div>
  );
}

function RolleCard({
  selected, onSelect, icon, title, subtitle, bullets,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  bullets: string[];
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`text-left rounded-card border p-6 transition-all ${
        selected
          ? 'border-bronze bg-bronze/5 shadow-focus'
          : 'border-stone bg-paper hover:border-bronze/40 hover:bg-cream/40'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        {icon}
        <span
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
            selected ? 'border-bronze bg-bronze text-cream' : 'border-stone'
          }`}
        >
          {selected && <Check className="w-3 h-3" strokeWidth={3} />}
        </span>
      </div>
      <h3 className="font-serif text-head-md text-navy mb-1.5">{title}</h3>
      <p className="text-caption text-muted mb-5">{subtitle}</p>
      <ul className="space-y-1.5">
        {bullets.map((b) => (
          <li key={b} className="text-caption text-ink leading-snug flex items-start gap-2">
            <span className="text-bronze mt-1.5 w-1 h-1 rounded-full bg-bronze flex-shrink-0" />
            {b}
          </li>
        ))}
      </ul>
    </button>
  );
}

/* ────────────────── Step 2: Profil ────────────────── */
function StepProfil({
  fullName, kanton, sprache, kantone,
  onName, onKanton, onSprache, onBack, onNext, canNext,
}: {
  fullName: string;
  kanton: string;
  sprache: Props['defaultSprache'];
  kantone: ReadonlyArray<readonly [string, string]>;
  onName: (v: string) => void;
  onKanton: (v: string) => void;
  onSprache: (v: Props['defaultSprache']) => void;
  onBack: () => void;
  onNext: () => void;
  canNext: boolean;
}) {
  return (
    <div className="space-y-6">
      <p className="text-body text-muted leading-relaxed mb-2">
        Ein paar Basis-Angaben für dein Profil. Du kannst sie später anpassen.
      </p>

      <div>
        <Label htmlFor="full_name">Vollständiger Name</Label>
        <Input
          id="full_name"
          type="text"
          autoComplete="name"
          required
          minLength={2}
          maxLength={120}
          value={fullName}
          onChange={(e) => onName(e.target.value)}
          placeholder="Anna Müller"
        />
      </div>

      <div>
        <Label htmlFor="kanton">Kanton</Label>
        <select
          id="kanton"
          value={kanton}
          onChange={(e) => onKanton(e.target.value)}
          required
          className="w-full bg-paper border border-stone rounded-soft px-4 py-3 text-body font-sans text-ink transition-colors duration-200 focus:outline-none focus:border-bronze focus:shadow-focus"
        >
          <option value="" disabled>— Wähle einen Kanton —</option>
          {kantone.map(([code, label]) => (
            <option key={code} value={code}>{label} ({code})</option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="sprache">Bevorzugte Sprache</Label>
        <div className="grid grid-cols-4 gap-2">
          {SPRACHEN.map(([code, label]) => (
            <button
              type="button"
              key={code}
              onClick={() => onSprache(code as Props['defaultSprache'])}
              className={`py-3 rounded-soft border text-body-sm transition-all ${
                sprache === code
                  ? 'border-bronze bg-bronze/10 text-navy font-medium'
                  : 'border-stone bg-paper text-muted hover:border-bronze/40'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button onClick={onBack} variant="ghost" size="lg">
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> Zurück
        </Button>
        <Button onClick={onNext} disabled={!canNext} size="lg" className="disabled:opacity-40">
          Weiter <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
        </Button>
      </div>
    </div>
  );
}

/* ────────────────── Step 3: Bestätigen ────────────────── */
function StepBestaetigen({
  rolle, fullName, kanton, sprache,
  acceptAgb, acceptDs,
  onAcceptAgb, onAcceptDs,
  onBack, canSubmit, pending, error,
}: {
  rolle: Rolle;
  fullName: string;
  kanton: string;
  sprache: string;
  acceptAgb: boolean;
  acceptDs: boolean;
  onAcceptAgb: (v: boolean) => void;
  onAcceptDs: (v: boolean) => void;
  onBack: () => void;
  canSubmit: boolean;
  pending: boolean;
  error: string | null;
}) {
  const rolleLabel = rolle === 'verkaeufer' ? 'Verkäufer:in' : 'Käufer:in';

  return (
    <div className="space-y-6">
      <p className="text-body text-muted leading-relaxed">
        Letzter Schritt: Bitte überprüfe deine Angaben und akzeptiere die rechtlichen
        Bedingungen.
      </p>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 border border-stone rounded-card p-5 bg-cream/30">
        <Item k="Rolle" v={rolleLabel} />
        <Item k="Name" v={fullName} />
        <Item k="Kanton" v={kanton} />
        <Item k="Sprache" v={sprache} />
      </dl>

      <div className="space-y-3">
        <label className="flex items-start gap-3 text-body-sm text-ink leading-snug cursor-pointer">
          <input
            type="checkbox"
            name="accept_agb"
            checked={acceptAgb}
            onChange={(e) => onAcceptAgb(e.target.checked)}
            className="mt-[3px] h-4 w-4 accent-bronze cursor-pointer flex-shrink-0"
          />
          <span>
            Ich akzeptiere die{' '}
            <a href="/agb" target="_blank" className="editorial text-navy">AGB</a>{' '}
            in der Version vom April 2026.
          </span>
        </label>
        <label className="flex items-start gap-3 text-body-sm text-ink leading-snug cursor-pointer">
          <input
            type="checkbox"
            name="accept_datenschutz"
            checked={acceptDs}
            onChange={(e) => onAcceptDs(e.target.checked)}
            className="mt-[3px] h-4 w-4 accent-bronze cursor-pointer flex-shrink-0"
          />
          <span>
            Ich habe die{' '}
            <a href="/datenschutz" target="_blank" className="editorial text-navy">Datenschutzerklärung</a>{' '}
            (April 2026) gelesen und stimme der Verarbeitung meiner Daten zu.
          </span>
        </label>
      </div>

      {error && (
        <p className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-soft px-4 py-3">
          {error}
        </p>
      )}

      <div className="flex justify-between pt-4">
        <Button onClick={onBack} variant="ghost" size="lg">
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> Zurück
        </Button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center justify-center gap-2 font-sans font-medium transition-all duration-300 ease-out-expo disabled:opacity-40 disabled:pointer-events-none select-none tracking-[-0.005em] px-8 py-4 text-base rounded-soft bg-navy text-cream hover:bg-ink hover:-translate-y-[1px] hover:shadow-lift"
        >
          {pending ? 'Speichere…' : (
            <>
              Konto einrichten <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="overline mb-1 text-quiet">{k}</dt>
      <dd className="text-body text-ink">{v}</dd>
    </div>
  );
}
