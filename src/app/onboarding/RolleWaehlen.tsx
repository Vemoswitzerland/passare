'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Building2, Search, ArrowRight, Briefcase, Check } from 'lucide-react';
import { setRolleAction } from './actions';
import { cn } from '@/lib/utils';

type Rolle = 'verkaeufer' | 'kaeufer' | 'broker';

/**
 * Rolle-Auswahl mit zwei Schritten: erst Karte anwählen, dann
 * Weiter-Button absenden.
 *
 * Wichtig (Bug-Fix): Vorher wurde `setRolleAction` über `useTransition`
 * mit `async/await` aufgerufen — der `pending`-Indikator löste sich
 * dann zu früh, da `redirect()` keine echte Promise zurückgibt. Jetzt
 * läuft alles über ein `<form action={…}>` mit `<button type="submit">`,
 * also nutzen wir `useFormStatus()` zur Pending-Anzeige.
 */
export function RolleWaehlen() {
  const [selected, setSelected] = useState<Rolle | null>(null);

  // Server-Action ist in actions.ts und akzeptiert FormData (siehe `rolle`-input).
  return (
    <form action={submitRolleViaFormData} className="space-y-4">
      {/* Hidden: gewählte Rolle wird via FormData übermittelt */}
      <input type="hidden" name="rolle" value={selected ?? ''} />

      <Cards selected={selected} setSelected={setSelected} />

      <BrokerOption selected={selected} setSelected={setSelected} />

      <FooterRow selected={selected} />
    </form>
  );
}

/** Wrapper-Action: liest Rolle aus FormData und delegiert. */
async function submitRolleViaFormData(formData: FormData) {
  const rolle = formData.get('rolle');
  if (rolle !== 'verkaeufer' && rolle !== 'kaeufer' && rolle !== 'broker') return;
  await setRolleAction(rolle);
}

function Cards({
  selected, setSelected,
}: {
  selected: Rolle | null;
  setSelected: (r: Rolle) => void;
}) {
  const { pending } = useFormStatus();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <RoleCard
        rolle="verkaeufer"
        selected={selected === 'verkaeufer'}
        icon={Building2}
        title="Ich verkaufe"
        desc="Mein Unternehmen bei passare anbieten. Anonym, inkl. Bewertung — Sie behalten die Kontrolle."
        onClick={() => setSelected('verkaeufer')}
        disabled={pending}
      />
      <RoleCard
        rolle="kaeufer"
        selected={selected === 'kaeufer'}
        icon={Search}
        title="Ich kaufe"
        desc="Schweizer KMU finden, Anfragen stellen, Datenraum einsehen — gratis starten."
        onClick={() => setSelected('kaeufer')}
        disabled={pending}
      />
    </div>
  );
}

function BrokerOption({
  selected, setSelected,
}: {
  selected: Rolle | null;
  setSelected: (r: Rolle) => void;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="button"
      onClick={() => setSelected('broker')}
      disabled={pending}
      className={cn(
        'group w-full rounded-soft border bg-paper p-6 text-left hover:shadow-lift transition-all disabled:opacity-50',
        selected === 'broker' ? 'border-bronze ring-2 ring-bronze/20' : 'border-stone hover:border-bronze',
      )}
    >
      <div className="flex items-center gap-4">
        <Briefcase className="w-7 h-7 text-bronze flex-shrink-0" strokeWidth={1.5} />
        <div className="flex-1">
          <h2 className="font-serif text-head-sm text-navy">Ich bin Broker / M&A-Berater</h2>
          <p className="text-body-sm text-muted mt-1">
            Mehrere Mandate verwalten + aktiv für Käufer suchen — beides in einem Abo.
          </p>
        </div>
        {selected === 'broker' ? (
          <Check className="w-5 h-5 text-bronze flex-shrink-0" strokeWidth={2} />
        ) : (
          <ArrowRight className="w-4 h-4 text-bronze group-hover:text-bronze-ink flex-shrink-0" strokeWidth={1.5} />
        )}
      </div>
    </button>
  );
}

function FooterRow({ selected }: { selected: Rolle | null }) {
  const { pending } = useFormStatus();
  return (
    <div className="pt-4 flex items-center justify-end">
      <button
        type="submit"
        disabled={!selected || pending}
        className="inline-flex items-center gap-2 px-6 py-3 bg-navy text-cream rounded-soft text-body-sm font-medium hover:bg-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {pending ? 'Weiter…' : (
          <>Weiter <ArrowRight className="w-4 h-4" strokeWidth={1.5} /></>
        )}
      </button>
    </div>
  );
}

function RoleCard({
  selected, icon: Icon, title, desc, onClick, disabled,
}: {
  rolle: Rolle;
  selected: boolean;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  desc: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group rounded-soft border bg-paper p-8 text-left hover:shadow-lift transition-all disabled:opacity-50',
        selected
          ? 'border-bronze ring-2 ring-bronze/20'
          : 'border-stone hover:border-bronze',
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <Icon className="w-8 h-8 text-bronze" strokeWidth={1.5} />
        {selected && <Check className="w-5 h-5 text-bronze" strokeWidth={2} />}
      </div>
      <h2 className="font-serif text-h3 text-navy mb-2">{title}</h2>
      <p className="text-body-sm text-muted">{desc}</p>
    </button>
  );
}
