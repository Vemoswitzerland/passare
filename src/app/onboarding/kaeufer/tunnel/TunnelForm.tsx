'use client';

import { useActionState, useState, useMemo } from 'react';
import {
  ArrowRight, Building2, Briefcase, Landmark, UserPlus, Handshake,
  Check, Sparkles, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/input';
import { submitKaeuferTunnelAction, skipKaeuferTunnelAction } from './actions';
import { KANTON_CODES } from '@/lib/constants';
import type { Branche } from '@/lib/branchen';
import type { ActionResult } from '@/app/auth/constants';
import { cn } from '@/lib/utils';

const INVESTOR_OPTIONS = [
  { value: 'privatperson',         label: 'Privatperson',        desc: 'MBI / erste Akquisition',           icon: UserPlus },
  { value: 'family_office',        label: 'Family Office',       desc: 'Beteiligungen für Vermögen',         icon: Landmark },
  { value: 'holding_strategisch',  label: 'Strategischer Käufer',desc: 'Holding mit Branchen-Strategie',     icon: Building2 },
  { value: 'mbi_management',       label: 'MBI-Manager',         desc: 'Erfahrener Manager auf Übernahme-Suche', icon: Briefcase },
  { value: 'berater_broker',       label: 'Berater / Broker',    desc: 'Suche im Mandanten-Auftrag',         icon: Handshake },
] as const;

export function TunnelForm({ branchen }: { branchen: Branche[] }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    submitKaeuferTunnelAction,
    null,
  );

  const [step, setStep] = useState(0);
  const [branchenSelected, setBranchenSelected] = useState<string[]>([]);
  const [kantone, setKantone] = useState<string[]>([]);
  const [chWeit, setChWeit] = useState(false);
  const [investorTyp, setInvestorTyp] = useState<string>('');
  const [budgetUndisclosed, setBudgetUndisclosed] = useState(false);
  const [budgetMin, setBudgetMin] = useState(500_000);
  const [budgetMax, setBudgetMax] = useState(5_000_000);
  // Beschreibung wurde aus dem Tunnel entfernt (gehört zur Anfrage, nicht zum Profil) —
  // wird leer mitgeschickt damit die bestehende Action-Schema-Validation passt.
  const beschreibung = '';

  const totalSteps = 2;
  const progress = Math.round(((step + 1) / totalSteps) * 100);

  const canNext = useMemo(() => {
    switch (step) {
      case 0: return branchenSelected.length > 0 && (chWeit || kantone.length > 0);
      case 1: return budgetUndisclosed || budgetMax >= budgetMin;
      default: return false;
    }
  }, [step, branchenSelected, chWeit, kantone, budgetUndisclosed, budgetMin, budgetMax]);

  const toggleBranche = (b: string) => {
    setBranchenSelected((prev) => prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]);
  };
  const toggleKanton = (k: string) => {
    setKantone((prev) => prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]);
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

      <div className="px-6 md:px-10 py-5 border-b border-stone flex items-center justify-between">
        <p className="overline text-bronze">Frage {step + 1} von {totalSteps}</p>
        <form action={skipKaeuferTunnelAction}>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 font-mono text-caption text-quiet hover:text-navy transition-colors"
          >
            <X className="w-3.5 h-3.5" strokeWidth={1.5} />
            Überspringen
          </button>
        </form>
      </div>

      <form action={action} className="px-6 md:px-10 py-8 md:py-10 space-y-6">
        {/* Hidden fields */}
        <input type="hidden" name="branchen" value={branchenSelected.join(',')} />
        <input type="hidden" name="kantone" value={chWeit ? 'CH' : kantone.join(',')} />
        <input type="hidden" name="investor_typ" value={investorTyp} />
        <input type="hidden" name="budget_min" value={budgetUndisclosed ? '' : String(budgetMin)} />
        <input type="hidden" name="budget_max" value={budgetUndisclosed ? '' : String(budgetMax)} />
        <input type="hidden" name="budget_undisclosed" value={budgetUndisclosed ? 'on' : ''} />
        <input type="hidden" name="beschreibung" value={beschreibung} />

        {/* ─── STEP 0: Was suchst du? (Branchen + Kantone) ─── */}
        {step === 0 && (
          <div className="space-y-6 animate-fade-up">
            <div>
              <p className="font-serif text-head-md text-navy font-normal mb-2">
                Was suchst du<span className="text-bronze">?</span>
              </p>
              <p className="text-body-sm text-muted">
                Wähle deine Branchen und Regionen — wir bauen daraus dein Suchprofil.
              </p>
            </div>

            <div>
              <Label>Branchen</Label>
              <div className="flex flex-wrap gap-2">
                {branchen.map((b) => {
                  const active = branchenSelected.includes(b.id);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => toggleBranche(b.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-pill text-caption font-medium border transition-all',
                        active
                          ? 'bg-bronze text-cream border-bronze'
                          : 'bg-paper text-muted border-stone hover:border-bronze hover:text-navy',
                      )}
                    >
                      {b.label_de}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="!mb-0">Kantone {chWeit ? '(CH-weit)' : kantone.length > 0 && `(${kantone.length})`}</Label>
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
                        className={cn(
                          'font-mono text-[11px] py-1.5 rounded-soft border transition-colors',
                          active
                            ? 'bg-navy text-cream border-navy'
                            : 'bg-paper text-muted border-stone hover:border-bronze hover:text-navy',
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

        {/* ─── STEP 1: Wer + Budget ─── */}
        {step === 1 && (
          <div className="space-y-7 animate-fade-up">
            <div>
              <p className="font-serif text-head-md text-navy font-normal mb-2">
                Wer bist du<span className="text-bronze">?</span>
              </p>
              <p className="text-body-sm text-muted">
                Verkäufer sehen das später — gibt ihnen Vertrauen.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-2">
              {INVESTOR_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = investorTyp === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setInvestorTyp(opt.value)}
                    className={cn(
                      'group text-left p-4 rounded-soft border-2 transition-all flex gap-3 items-start',
                      active
                        ? 'border-bronze bg-bronze/5'
                        : 'border-stone bg-paper hover:border-navy/40',
                    )}
                  >
                    <div className={cn(
                      'w-9 h-9 rounded-soft flex items-center justify-center flex-shrink-0',
                      active ? 'bg-bronze/20' : 'bg-stone/50',
                    )}>
                      <Icon className={cn('w-4 h-4', active ? 'text-bronze-ink' : 'text-navy')} strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-body-sm font-medium', active ? 'text-navy' : 'text-ink')}>
                        {opt.label}
                      </p>
                      <p className="text-caption text-quiet leading-snug mt-0.5">{opt.desc}</p>
                    </div>
                    {active && <Check className="w-4 h-4 text-bronze flex-shrink-0 mt-1" strokeWidth={2} />}
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-stone">
              <p className="font-serif text-head-sm text-navy font-normal mb-2">
                Wie viel ist dein Rahmen<span className="text-bronze">?</span>
              </p>
              <p className="text-body-sm text-muted mb-4">Optional — du kannst es auch geheim halten.</p>

              <label className="flex items-center gap-3 cursor-pointer p-3 border border-stone rounded-soft hover:border-bronze mb-3">
                <input
                  type="checkbox"
                  checked={budgetUndisclosed}
                  onChange={(e) => setBudgetUndisclosed(e.target.checked)}
                  className="h-4 w-4 accent-bronze"
                />
                <span className="text-body-sm text-navy">Möchte ich (noch) nicht angeben</span>
              </label>

              {!budgetUndisclosed && (
                <>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="bmin">Mindestens</Label>
                      <select
                        id="bmin"
                        value={budgetMin}
                        onChange={(e) => setBudgetMin(parseInt(e.target.value, 10))}
                        className="w-full bg-paper border border-stone rounded-soft px-4 py-2.5 text-body-sm font-mono text-ink focus:outline-none focus:border-bronze"
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
                        className="w-full bg-paper border border-stone rounded-soft px-4 py-2.5 text-body-sm font-mono text-ink focus:outline-none focus:border-bronze"
                      >
                        {[1_000_000, 2_000_000, 5_000_000, 10_000_000, 20_000_000, 50_000_000].map((v) => (
                          <option key={v} value={v}>CHF {(v / 1_000_000).toFixed(0)} Mio</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-caption text-quiet mt-2">
                    Range: <span className="font-mono text-navy">CHF {(budgetMin / 1_000_000).toFixed(1).replace('.0', '')} – {(budgetMax / 1_000_000).toFixed(0)} Mio</span>
                  </p>
                </>
              )}
            </div>

            {/* Suchprofil-Hinweis als finaler Trust-Anker direkt vor dem Submit */}
            <div className="flex items-start gap-3 p-4 bg-bronze/5 border border-bronze/20 rounded-soft">
              <Sparkles className="w-5 h-5 text-bronze flex-shrink-0 mt-0.5" strokeWidth={1.5} />
              <div className="text-body-sm text-muted leading-relaxed">
                <p className="text-navy font-medium mb-1">Gleich erstellen wir dein erstes Suchprofil.</p>
                Treffer kommen per E-Mail — Käufer+ in Echtzeit, Basic als wöchentlicher Digest.
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
            <Button type="submit" disabled={pending} size="md">
              {pending ? 'Speichern…' : (
                <>Profil speichern <ArrowRight className="w-4 h-4" strokeWidth={1.5} /></>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
