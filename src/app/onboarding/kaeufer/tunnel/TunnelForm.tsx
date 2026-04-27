'use client';

import { useActionState, useState, useMemo } from 'react';
import {
  ArrowRight, Building2, Briefcase, Landmark, UserPlus, Handshake,
  Check, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { submitKaeuferTunnelAction } from './actions';
import { BRANCHEN_LIST, KANTON_CODES } from '@/lib/listings-mock';
import { KANTONE } from '@/app/auth/constants';
import type { ActionResult } from '@/app/auth/constants';
import { cn } from '@/lib/utils';

const INVESTOR_OPTIONS = [
  {
    value: 'privatperson',
    label: 'Privatperson',
    desc: 'Ich kaufe für mich persönlich (MBI / erste Akquisition).',
    icon: UserPlus,
  },
  {
    value: 'family_office',
    label: 'Family Office',
    desc: 'Wir suchen Beteiligungen für ein bestehendes Vermögen.',
    icon: Landmark,
  },
  {
    value: 'holding_strategisch',
    label: 'Strategischer Käufer',
    desc: 'Holding / Konzern mit klarer Branchen-Strategie.',
    icon: Building2,
  },
  {
    value: 'mbi_management',
    label: 'MBI-Manager',
    desc: 'Erfahrener Manager auf Übernahme-Suche.',
    icon: Briefcase,
  },
  {
    value: 'berater_broker',
    label: 'Berater / Broker',
    desc: 'Ich suche im Auftrag eines Mandanten.',
    icon: Handshake,
  },
] as const;

const TIMING_OPTIONS = [
  { value: 'sofort',       label: 'Sofort', desc: 'Innerhalb der nächsten 3 Monate' },
  { value: '3_monate',     label: '3–6 Monate', desc: 'Konkrete Suche' },
  { value: '6_monate',     label: '6–12 Monate', desc: 'Mittelfristig' },
  { value: '12_monate',    label: 'Über 12 Monate', desc: 'Langfristige Beobachtung' },
  { value: 'nur_browsing', label: 'Nur browsing', desc: 'Schaue mich erstmal um' },
] as const;

const ERFAHRUNG_OPTIONS = [
  { value: 'erstkaeufer', label: 'Erstkäufer', desc: 'Meine erste Akquisition' },
  { value: '1_3_deals',   label: '1–3 Deals',   desc: 'Bereits Erfahrung gesammelt' },
  { value: '4_plus_deals',label: '4+ Deals',    desc: 'Erfahrener Investor' },
] as const;

type Props = {
  defaultName: string;
};

export function TunnelForm({ defaultName }: Props) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    submitKaeuferTunnelAction,
    null,
  );

  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState(defaultName);
  const [kanton, setKanton] = useState('');
  const [investorTyp, setInvestorTyp] = useState<string>('');
  const [branchen, setBranchen] = useState<string[]>([]);
  const [kantone, setKantone] = useState<string[]>([]);
  const [chWeit, setChWeit] = useState(false);
  const [budgetUndisclosed, setBudgetUndisclosed] = useState(false);
  const [budgetMin, setBudgetMin] = useState(500_000);
  const [budgetMax, setBudgetMax] = useState(5_000_000);
  const [timing, setTiming] = useState<string>('');
  const [erfahrung, setErfahrung] = useState<string>('');
  const [beschreibung, setBeschreibung] = useState('');

  const totalSteps = 6; // Name+Kanton, Investor-Typ, Branche+Kanton, Budget, Timing+Erfahrung, optional Beschreibung
  const progress = Math.round(((step + 1) / totalSteps) * 100);

  const canNext = useMemo(() => {
    switch (step) {
      case 0: return fullName.trim().length >= 2 && kanton.length === 2;
      case 1: return !!investorTyp;
      case 2: return branchen.length > 0 && (chWeit || kantone.length > 0);
      case 3: return budgetUndisclosed || budgetMax >= budgetMin;
      case 4: return !!timing && !!erfahrung;
      case 5: return true;
      default: return false;
    }
  }, [step, fullName, kanton, investorTyp, branchen, chWeit, kantone, budgetUndisclosed, budgetMin, budgetMax, timing, erfahrung]);

  const toggleBranche = (b: string) => {
    setBranchen((prev) =>
      prev.includes(b)
        ? prev.filter((x) => x !== b)
        : prev.length < 5 ? [...prev, b] : prev,
    );
  };

  const toggleKanton = (k: string) => {
    setKantone((prev) =>
      prev.includes(k)
        ? prev.filter((x) => x !== k)
        : prev.length < 5 ? [...prev, k] : prev,
    );
  };

  return (
    <div className="bg-paper border border-stone rounded-card overflow-hidden">
      {/* Progress Bar */}
      <div className="h-1 bg-stone">
        <div
          className="h-full bg-bronze transition-all duration-700 ease-out-expo"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="px-6 md:px-10 py-6 border-b border-stone flex items-center justify-between">
        <p className="overline text-bronze">Schritt {step + 1} von {totalSteps}</p>
        <p className="font-mono text-caption text-quiet">~ 90 Sekunden</p>
      </div>

      <form action={action} className="px-6 md:px-10 py-8 md:py-10 space-y-6">
        {/* Hidden fields */}
        <input type="hidden" name="full_name" value={fullName} />
        <input type="hidden" name="kanton" value={kanton} />
        <input type="hidden" name="investor_typ" value={investorTyp} />
        <input type="hidden" name="branchen" value={branchen.join(',')} />
        <input type="hidden" name="kantone" value={chWeit ? 'CH' : kantone.join(',')} />
        <input type="hidden" name="budget_min" value={budgetUndisclosed ? '' : String(budgetMin)} />
        <input type="hidden" name="budget_max" value={budgetUndisclosed ? '' : String(budgetMax)} />
        <input type="hidden" name="budget_undisclosed" value={budgetUndisclosed ? 'on' : ''} />
        <input type="hidden" name="timing" value={timing} />
        <input type="hidden" name="erfahrung" value={erfahrung} />
        <input type="hidden" name="beschreibung" value={beschreibung} />

        {/* ─── STEP 0: Name + Kanton ─── */}
        {step === 0 && (
          <div className="space-y-6 animate-fade-up">
            <div>
              <p className="font-serif text-head-md text-navy font-normal mb-2">
                Hi! Lass uns kurz starten<span className="text-bronze">.</span>
              </p>
              <p className="text-body-sm text-muted">
                Wie heisst du, und wo ist dein Wohnsitz? (Wir teilen das nur mit Verkäufern, denen du selbst eine Anfrage schickst.)
              </p>
            </div>

            <div>
              <Label htmlFor="full_name">Vollständiger Name</Label>
              <Input
                id="full_name"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Anna Müller"
                required
                minLength={2}
                maxLength={120}
              />
            </div>

            <div>
              <Label htmlFor="kanton">Wohnsitz-Kanton</Label>
              <select
                id="kanton"
                value={kanton}
                onChange={(e) => setKanton(e.target.value)}
                className="w-full bg-paper border border-stone rounded-soft px-4 py-3 text-body font-sans text-ink focus:outline-none focus:border-bronze focus:shadow-focus"
              >
                <option value="" disabled>— Wähle einen Kanton —</option>
                {KANTONE.map(([code, label]) => (
                  <option key={code} value={code}>{label} ({code})</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* ─── STEP 1: Investor-Typ ─── */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-up">
            <div>
              <p className="font-serif text-head-md text-navy font-normal mb-2">
                Was beschreibt dich am besten<span className="text-bronze">?</span>
              </p>
              <p className="text-body-sm text-muted">
                Verkäufer sehen das später — gibt ihnen Vertrauen, wem sie das NDA freigeben.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {INVESTOR_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = investorTyp === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setInvestorTyp(opt.value)}
                    className={cn(
                      'group text-left p-5 rounded-card border-2 transition-all flex gap-4 items-start',
                      active
                        ? 'border-bronze bg-bronze/5 shadow-focus'
                        : 'border-stone bg-paper hover:border-navy/40',
                    )}
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-soft flex items-center justify-center flex-shrink-0',
                      active ? 'bg-bronze/20' : 'bg-stone/50',
                    )}>
                      <Icon className={cn('w-5 h-5', active ? 'text-bronze-ink' : 'text-navy')} strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-body-sm font-medium mb-1', active ? 'text-navy' : 'text-ink')}>
                        {opt.label}
                      </p>
                      <p className="text-caption text-quiet leading-snug">{opt.desc}</p>
                    </div>
                    {active && <Check className="w-4 h-4 text-bronze flex-shrink-0 mt-1" strokeWidth={2} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── STEP 2: Branche + Kanton ─── */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-up">
            <div>
              <p className="font-serif text-head-md text-navy font-normal mb-2">
                Was suchst du<span className="text-bronze">?</span>
              </p>
              <p className="text-body-sm text-muted">
                Wähle bis zu 5 Branchen und Kantone. Du kannst jederzeit weitere Suchprofile anlegen.
              </p>
            </div>

            <div>
              <Label>Branchen ({branchen.length}/5)</Label>
              <div className="flex flex-wrap gap-2">
                {BRANCHEN_LIST.map((b) => {
                  const active = branchen.includes(b);
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => toggleBranche(b)}
                      disabled={!active && branchen.length >= 5}
                      className={cn(
                        'px-3 py-1.5 rounded-pill text-caption font-medium border transition-all',
                        active
                          ? 'bg-bronze text-cream border-bronze'
                          : 'bg-paper text-muted border-stone hover:border-bronze hover:text-navy',
                        !active && branchen.length >= 5 && 'opacity-40 cursor-not-allowed hover:border-stone hover:text-muted',
                      )}
                    >
                      {b}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="!mb-0">Kantone ({chWeit ? 'CH-weit' : `${kantone.length}/5`})</Label>
                <label className="flex items-center gap-2 cursor-pointer text-caption text-muted">
                  <input
                    type="checkbox"
                    checked={chWeit}
                    onChange={(e) => setChWeit(e.target.checked)}
                    className="h-4 w-4 accent-bronze"
                  />
                  Schweizweit
                </label>
              </div>
              {!chWeit && (
                <div className="grid grid-cols-7 sm:grid-cols-9 gap-1.5">
                  {KANTON_CODES.map((k) => {
                    const active = kantone.includes(k);
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => toggleKanton(k)}
                        disabled={!active && kantone.length >= 5}
                        className={cn(
                          'font-mono text-[11px] py-1.5 rounded-soft border transition-colors',
                          active
                            ? 'bg-navy text-cream border-navy'
                            : 'bg-paper text-muted border-stone hover:border-bronze hover:text-navy',
                          !active && kantone.length >= 5 && 'opacity-40 cursor-not-allowed',
                        )}
                      >
                        {k}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── STEP 3: Budget ─── */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-up">
            <div>
              <p className="font-serif text-head-md text-navy font-normal mb-2">
                Wieviel ist dein Rahmen<span className="text-bronze">?</span>
              </p>
              <p className="text-body-sm text-muted">
                Für die Match-Qualität — wir zeigen dir nur Inserate die zu deiner Range passen. Du kannst es auch geheim halten.
              </p>
            </div>

            <label className="flex items-center gap-3 cursor-pointer p-4 border border-stone rounded-soft hover:border-bronze">
              <input
                type="checkbox"
                checked={budgetUndisclosed}
                onChange={(e) => setBudgetUndisclosed(e.target.checked)}
                className="h-4 w-4 accent-bronze"
              />
              <div>
                <p className="text-body-sm text-navy font-medium">Budget möchte ich noch nicht angeben</p>
                <p className="text-caption text-quiet">Du kannst Filter dann nicht so präzise nutzen.</p>
              </div>
            </label>

            {!budgetUndisclosed && (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bmin">Mindestens</Label>
                    <select
                      id="bmin"
                      value={budgetMin}
                      onChange={(e) => setBudgetMin(parseInt(e.target.value, 10))}
                      className="w-full bg-paper border border-stone rounded-soft px-4 py-3 text-body font-sans text-ink font-mono focus:outline-none focus:border-bronze"
                    >
                      {[200_000, 500_000, 1_000_000, 2_000_000, 5_000_000, 10_000_000, 20_000_000].map((v) => (
                        <option key={v} value={v}>CHF {(v / 1_000_000).toFixed(1).replace('.0', '')} Mio</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="bmax">Maximum</Label>
                    <select
                      id="bmax"
                      value={budgetMax}
                      onChange={(e) => setBudgetMax(parseInt(e.target.value, 10))}
                      className="w-full bg-paper border border-stone rounded-soft px-4 py-3 text-body font-sans text-ink font-mono focus:outline-none focus:border-bronze"
                    >
                      {[1_000_000, 2_000_000, 5_000_000, 10_000_000, 20_000_000, 50_000_000].map((v) => (
                        <option key={v} value={v}>CHF {(v / 1_000_000).toFixed(0)} Mio</option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="text-caption text-quiet">
                  Range: <span className="font-mono text-navy">CHF {(budgetMin / 1_000_000).toFixed(1).replace('.0', '')} – {(budgetMax / 1_000_000).toFixed(0)} Mio</span>
                </p>
              </>
            )}
          </div>
        )}

        {/* ─── STEP 4: Timing + Erfahrung ─── */}
        {step === 4 && (
          <div className="space-y-7 animate-fade-up">
            <div>
              <p className="font-serif text-head-md text-navy font-normal mb-2">
                Wann willst du übernehmen<span className="text-bronze">?</span>
              </p>
              <p className="text-body-sm text-muted">
                Hilft uns dir die richtigen Inserate zu zeigen. Verkäufer mit kurzem Timing matchen besser zu „Sofort".
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {TIMING_OPTIONS.map((opt) => {
                const active = timing === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTiming(opt.value)}
                    className={cn(
                      'text-left p-4 rounded-soft border-2 transition-all',
                      active
                        ? 'border-bronze bg-bronze/5 shadow-focus'
                        : 'border-stone bg-paper hover:border-navy/40',
                    )}
                  >
                    <p className={cn('text-body-sm font-medium mb-1', active ? 'text-navy' : 'text-ink')}>
                      {opt.label}
                    </p>
                    <p className="text-caption text-quiet leading-snug">{opt.desc}</p>
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <p className="font-serif text-head-sm text-navy font-normal mb-3">
                Wie viel Erfahrung hast du<span className="text-bronze">?</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {ERFAHRUNG_OPTIONS.map((opt) => {
                  const active = erfahrung === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setErfahrung(opt.value)}
                      className={cn(
                        'text-left p-4 rounded-soft border-2 transition-all',
                        active
                          ? 'border-bronze bg-bronze/5 shadow-focus'
                          : 'border-stone bg-paper hover:border-navy/40',
                      )}
                    >
                      <p className={cn('text-body-sm font-medium mb-1', active ? 'text-navy' : 'text-ink')}>
                        {opt.label}
                      </p>
                      <p className="text-caption text-quiet leading-snug">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─── STEP 5: Beschreibung (optional) + Submit ─── */}
        {step === 5 && (
          <div className="space-y-6 animate-fade-up">
            <div>
              <p className="font-serif text-head-md text-navy font-normal mb-2">
                Zum Schluss: erzähl uns mehr<span className="text-bronze">.</span>
              </p>
              <p className="text-body-sm text-muted">
                Optional. Verkäufer sehen das auf deinem Käufer-Profil — gut für ein erstes Vertrauen.
              </p>
            </div>

            <div>
              <Label htmlFor="beschreibung">Kurz-Beschreibung (optional)</Label>
              <textarea
                id="beschreibung"
                value={beschreibung}
                onChange={(e) => setBeschreibung(e.target.value)}
                placeholder="Beispiel: «Ich bin seit 12 Jahren in der Maschinenbau-Branche tätig und suche eine Übernahme im Raum ZH/AG für die nächste Generation meiner Firma.»"
                maxLength={2000}
                rows={5}
                className="w-full bg-paper border border-stone rounded-soft px-4 py-3 text-body font-sans text-ink resize-none focus:outline-none focus:border-bronze focus:shadow-focus"
              />
              <p className="text-caption text-quiet mt-1">{beschreibung.length} / 2000 Zeichen</p>
            </div>

            <div className="pt-4 border-t border-stone">
              <div className="flex items-start gap-3 p-4 bg-bronze/5 border border-bronze/20 rounded-soft">
                <Sparkles className="w-5 h-5 text-bronze flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                <div className="text-body-sm text-muted leading-relaxed">
                  <p className="text-navy font-medium mb-1">Gleich erstellen wir dein erstes Suchprofil.</p>
                  Du bekommst täglich um 7:00 Uhr eine E-Mail mit den 3 besten Treffern, basierend auf deinen Antworten.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Error-Display ─── */}
        {state && !state.ok && (
          <div className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-soft px-4 py-3">
            {state.error}
          </div>
        )}

        {/* ─── Navigation ─── */}
        <div className="flex items-center justify-between pt-4 border-t border-stone">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || pending}
            className="font-mono text-caption uppercase tracking-widest text-quiet hover:text-navy disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← Zurück
          </button>

          {step < totalSteps - 1 ? (
            <Button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext}
              size="md"
            >
              Weiter <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </Button>
          ) : (
            <Button type="submit" disabled={pending || !canNext} size="md">
              {pending ? 'Speichern…' : (
                <>Profil speichern & weiter <ArrowRight className="w-4 h-4" strokeWidth={1.5} /></>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
