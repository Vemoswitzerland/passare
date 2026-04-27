'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/input';
import { updateKaeuferProfilAction } from './actions';
import { BRANCHEN_LIST, KANTON_CODES } from '@/lib/listings-mock';
import { cn } from '@/lib/utils';

type Initial = {
  investor_typ: string | null;
  budget_min: number | null;
  budget_max: number | null;
  budget_undisclosed: boolean;
  regionen: string[];
  branche_praeferenzen: string[];
  timing: string | null;
  erfahrung: string | null;
  beschreibung: string | null;
  ist_oeffentlich: boolean;
  finanzierungsnachweis_verified: boolean;
  linkedin_url: string | null;
} | null;

const INVESTOR_OPTIONS = [
  { value: 'privatperson',         label: 'Privatperson' },
  { value: 'family_office',        label: 'Family Office' },
  { value: 'holding_strategisch',  label: 'Strategischer Käufer' },
  { value: 'mbi_management',       label: 'MBI-Manager' },
  { value: 'berater_broker',       label: 'Berater / Broker' },
];

const TIMING_OPTIONS = [
  { value: 'sofort',       label: 'Sofort' },
  { value: '3_monate',     label: '3–6 Monate' },
  { value: '6_monate',     label: '6–12 Monate' },
  { value: '12_monate',    label: 'Über 12 Monate' },
  { value: 'nur_browsing', label: 'Nur browsing' },
];

const ERFAHRUNG_OPTIONS = [
  { value: 'erstkaeufer',  label: 'Erstkäufer' },
  { value: '1_3_deals',    label: '1–3 Deals' },
  { value: '4_plus_deals', label: '4+ Deals' },
];

export function ProfilForm({ initial }: { initial: Initial }) {
  const [investorTyp, setInvestorTyp] = useState(initial?.investor_typ ?? '');
  const [branchen, setBranchen] = useState<string[]>(initial?.branche_praeferenzen ?? []);
  const [regionen, setRegionen] = useState<string[]>(initial?.regionen ?? []);
  const [budgetMin, setBudgetMin] = useState(initial?.budget_min ?? 500_000);
  const [budgetMax, setBudgetMax] = useState(initial?.budget_max ?? 5_000_000);
  const [budgetUndisclosed, setBudgetUndisclosed] = useState(initial?.budget_undisclosed ?? false);
  const [timing, setTiming] = useState(initial?.timing ?? '');
  const [erfahrung, setErfahrung] = useState(initial?.erfahrung ?? '');
  const [beschreibung, setBeschreibung] = useState(initial?.beschreibung ?? '');
  const [linkedin, setLinkedin] = useState(initial?.linkedin_url ?? '');
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (formData: FormData) => {
    setPending(true);
    setError(null);
    setSuccess(false);
    formData.set('branche_praeferenzen', branchen.join(','));
    formData.set('regionen', regionen.join(','));
    const result = await updateKaeuferProfilAction(formData);
    setPending(false);
    if (result.ok) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error);
    }
  };

  return (
    <form action={submit} className="bg-paper border border-stone rounded-card p-6 md:p-8 space-y-6">
      {/* Investor-Typ */}
      <div>
        <Label>Investor-Typ</Label>
        <select
          name="investor_typ"
          value={investorTyp}
          onChange={(e) => setInvestorTyp(e.target.value)}
          required
          className="w-full bg-paper border border-stone rounded-soft px-4 py-3 text-body font-sans text-ink focus:outline-none focus:border-bronze"
        >
          <option value="" disabled>— Auswählen —</option>
          {INVESTOR_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Budget */}
      <fieldset className="border-t border-stone pt-6">
        <legend className="overline text-bronze-ink mb-3">Budget-Range</legend>
        <label className="flex items-center gap-3 mb-4 p-3 border border-stone rounded-soft cursor-pointer hover:border-bronze">
          <input
            type="checkbox"
            name="budget_undisclosed"
            checked={budgetUndisclosed}
            onChange={(e) => setBudgetUndisclosed(e.target.checked)}
            className="h-4 w-4 accent-bronze"
          />
          <span className="text-body-sm text-navy">Budget nicht öffentlich anzeigen</span>
        </label>
        {!budgetUndisclosed && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bmin">Mindestens</Label>
              <select
                id="bmin"
                name="budget_min"
                value={budgetMin}
                onChange={(e) => setBudgetMin(parseInt(e.target.value, 10))}
                className="w-full bg-paper border border-stone rounded-soft px-4 py-3 text-body font-mono text-ink focus:outline-none focus:border-bronze"
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
                name="budget_max"
                value={budgetMax}
                onChange={(e) => setBudgetMax(parseInt(e.target.value, 10))}
                className="w-full bg-paper border border-stone rounded-soft px-4 py-3 text-body font-mono text-ink focus:outline-none focus:border-bronze"
              >
                {[1_000_000, 2_000_000, 5_000_000, 10_000_000, 20_000_000, 50_000_000].map((v) => (
                  <option key={v} value={v}>CHF {(v / 1_000_000).toFixed(0)} Mio</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </fieldset>

      {/* Regionen */}
      <fieldset className="border-t border-stone pt-6">
        <legend className="overline text-bronze-ink mb-3">Bevorzugte Regionen</legend>
        <div className="grid grid-cols-7 sm:grid-cols-9 gap-1.5">
          {KANTON_CODES.map((k) => {
            const active = regionen.includes(k);
            return (
              <button
                key={k}
                type="button"
                onClick={() =>
                  setRegionen((prev) => (active ? prev.filter((x) => x !== k) : [...prev, k]))
                }
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
        <p className="text-caption text-quiet mt-2">Leer lassen für schweizweit.</p>
      </fieldset>

      {/* Branchen */}
      <fieldset className="border-t border-stone pt-6">
        <legend className="overline text-bronze-ink mb-3">Branche-Präferenzen</legend>
        <div className="flex flex-wrap gap-2">
          {BRANCHEN_LIST.map((b) => {
            const active = branchen.includes(b);
            return (
              <button
                key={b}
                type="button"
                onClick={() =>
                  setBranchen((prev) => (active ? prev.filter((x) => x !== b) : [...prev, b]))
                }
                className={cn(
                  'px-3 py-1.5 rounded-pill text-caption font-medium border transition-all',
                  active
                    ? 'bg-bronze text-cream border-bronze'
                    : 'bg-paper text-muted border-stone hover:border-bronze hover:text-navy',
                )}
              >
                {b}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Timing + Erfahrung */}
      <div className="grid sm:grid-cols-2 gap-4 border-t border-stone pt-6">
        <div>
          <Label>Timing</Label>
          <select
            name="timing"
            value={timing}
            onChange={(e) => setTiming(e.target.value)}
            className="w-full bg-paper border border-stone rounded-soft px-4 py-3 text-body font-sans text-ink focus:outline-none focus:border-bronze"
          >
            <option value="">— Auswählen —</option>
            {TIMING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <Label>Erfahrung</Label>
          <select
            name="erfahrung"
            value={erfahrung}
            onChange={(e) => setErfahrung(e.target.value)}
            className="w-full bg-paper border border-stone rounded-soft px-4 py-3 text-body font-sans text-ink focus:outline-none focus:border-bronze"
          >
            <option value="">— Auswählen —</option>
            {ERFAHRUNG_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Beschreibung */}
      <div className="border-t border-stone pt-6">
        <Label htmlFor="beschreibung">Kurzbeschreibung</Label>
        <textarea
          id="beschreibung"
          name="beschreibung"
          value={beschreibung}
          onChange={(e) => setBeschreibung(e.target.value)}
          maxLength={2000}
          rows={4}
          placeholder="Erzähle Verkäufern, warum gerade du der richtige Käufer wärst…"
          className="w-full bg-paper border border-stone rounded-soft px-4 py-3 text-body font-sans text-ink resize-none focus:outline-none focus:border-bronze"
        />
        <p className="text-caption text-quiet mt-1">{beschreibung.length} / 2000</p>
      </div>

      {/* LinkedIn */}
      <div>
        <Label htmlFor="linkedin">LinkedIn-Profil (URL)</Label>
        <input
          id="linkedin"
          name="linkedin_url"
          type="url"
          value={linkedin}
          onChange={(e) => setLinkedin(e.target.value)}
          maxLength={200}
          placeholder="https://www.linkedin.com/in/..."
          className="w-full bg-paper border border-stone rounded-soft px-4 py-3 text-body font-sans text-ink focus:outline-none focus:border-bronze"
        />
      </div>

      {/* Sichtbarkeit */}
      <label className="flex items-start gap-3 p-3 border border-stone rounded-soft cursor-pointer hover:border-bronze">
        <input
          type="checkbox"
          name="ist_oeffentlich"
          defaultChecked={initial?.ist_oeffentlich ?? true}
          className="mt-1 h-4 w-4 accent-bronze"
        />
        <div className="text-body-sm text-ink leading-snug">
          <p className="text-navy font-medium">Profil für Verkäufer sichtbar machen</p>
          <p className="text-caption text-quiet">Verkäufer sehen dein Profil bei einer Anfrage. Kannst du jederzeit ändern.</p>
        </div>
      </label>

      {error && (
        <div className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-soft px-4 py-3">
          {error}
        </div>
      )}

      {success && (
        <div className="text-body-sm text-success bg-success/5 border border-success/20 rounded-soft px-4 py-3 inline-flex items-center gap-2">
          <Check className="w-4 h-4" strokeWidth={2} />
          Profil aktualisiert.
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-stone">
        <Button type="submit" disabled={pending}>
          {pending ? 'Speichern…' : 'Änderungen speichern'}
        </Button>
      </div>
    </form>
  );
}
