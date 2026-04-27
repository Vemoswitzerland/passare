'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Crown, Mail, MessageCircle, Smartphone, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { createSuchprofilAction } from '../actions';
import { BRANCHEN_LIST, KANTON_CODES } from '@/lib/listings-mock';
import { cn } from '@/lib/utils';

type Props = { isMax: boolean };

export function SuchprofilForm({ isMax }: Props) {
  const [branchen, setBranchen] = useState<string[]>([]);
  const [kantone, setKantone] = useState<string[]>([]);
  const [name, setName] = useState('Mein Suchprofil');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (formData: FormData) => {
    setPending(true);
    setError(null);
    formData.set('branche', branchen.join(','));
    formData.set('kantone', kantone.join(','));
    const result = await createSuchprofilAction(formData);
    setPending(false);
    if (result.ok) {
      window.location.href = '/dashboard/kaeufer/suchprofile';
    } else {
      setError(result.error);
    }
  };

  return (
    <form action={submit} className="bg-paper border border-stone rounded-card p-6 md:p-8 space-y-6">
      <div>
        <Label htmlFor="name">Profil-Name</Label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          required
          placeholder="z.B. Maschinenbau ZH/AG"
        />
      </div>

      <div>
        <Label>Branchen</Label>
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
      </div>

      <div>
        <Label>Kantone (leer = Schweizweit)</Label>
        <div className="grid grid-cols-7 sm:grid-cols-9 gap-1.5">
          {KANTON_CODES.map((k) => {
            const active = kantone.includes(k);
            return (
              <button
                key={k}
                type="button"
                onClick={() =>
                  setKantone((prev) => (active ? prev.filter((x) => x !== k) : [...prev, k]))
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
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="umsatz_min">Umsatz-Min (CHF)</Label>
          <Input id="umsatz_min" name="umsatz_min" type="number" min={0} step={100000} placeholder="0" />
        </div>
        <div>
          <Label htmlFor="umsatz_max">Umsatz-Max (CHF)</Label>
          <Input id="umsatz_max" name="umsatz_max" type="number" min={0} step={100000} placeholder="50000000" />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="ebitda_min">EBITDA-Marge min (%)</Label>
          <Input id="ebitda_min" name="ebitda_min" type="number" min={0} max={100} step={0.5} placeholder="10" />
        </div>
        <div>
          <Label htmlFor="ma_min">Mitarbeitende min</Label>
          <Input id="ma_min" name="ma_min" type="number" min={0} placeholder="0" />
        </div>
        <div>
          <Label htmlFor="ma_max">Mitarbeitende max</Label>
          <Input id="ma_max" name="ma_max" type="number" min={0} placeholder="500" />
        </div>
      </div>

      <fieldset className="border-t border-stone pt-5">
        <legend className="overline text-bronze-ink mb-3">Alert-Kanäle</legend>
        <div className="space-y-2">
          <CheckboxRow
            name="email_alert"
            icon={Mail}
            label="E-Mail · 1× pro Woche (Basic) bzw. täglich um 7:00 (MAX)"
            defaultChecked
          />
          <CheckboxRow
            name="whatsapp_alert"
            icon={MessageCircle}
            label="WhatsApp · in unter 5 Minuten bei einem Match"
            disabled={!isMax}
            note={!isMax ? 'Nur mit MAX-Abo' : undefined}
          />
          <CheckboxRow
            name="push_alert"
            icon={Smartphone}
            label="Push-Notification · sofort"
            disabled={!isMax}
            note={!isMax ? 'Nur mit MAX-Abo' : undefined}
          />
        </div>
        {!isMax && (
          <Link
            href="/dashboard/kaeufer/abo"
            className="mt-3 inline-flex items-center gap-1.5 text-caption text-bronze-ink hover:text-bronze underline decoration-dotted underline-offset-2"
          >
            <Crown className="w-3.5 h-3.5" strokeWidth={1.5} />
            Auf MAX upgraden für sofortige Alerts
          </Link>
        )}
      </fieldset>

      {error && (
        <div className="text-body-sm text-danger bg-danger/5 border border-danger/20 rounded-soft px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-stone">
        <Link
          href="/dashboard/kaeufer/suchprofile"
          className="font-mono text-caption uppercase tracking-widest text-quiet hover:text-navy"
        >
          Abbrechen
        </Link>
        <Button type="submit" disabled={pending}>
          {pending ? 'Speichern…' : (
            <>Profil erstellen <ArrowRight className="w-4 h-4" strokeWidth={1.5} /></>
          )}
        </Button>
      </div>
    </form>
  );
}

function CheckboxRow({
  name, icon: Icon, label, defaultChecked, disabled, note,
}: {
  name: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  defaultChecked?: boolean;
  disabled?: boolean;
  note?: string;
}) {
  return (
    <label className={cn(
      'flex items-start gap-3 p-3 border border-stone rounded-soft cursor-pointer transition-colors',
      disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-bronze',
    )}>
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        disabled={disabled}
        className="mt-1 h-4 w-4 accent-bronze flex-shrink-0"
      />
      <Icon className="w-4 h-4 text-bronze flex-shrink-0 mt-0.5" strokeWidth={1.5} />
      <div className="flex-1 text-body-sm text-ink leading-snug">
        {label}
        {note && <p className="text-caption text-quiet mt-0.5">{note}</p>}
      </div>
    </label>
  );
}
