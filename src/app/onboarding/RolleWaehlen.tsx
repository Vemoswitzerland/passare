'use client';

import { useTransition } from 'react';
import { Building2, Search, ArrowRight } from 'lucide-react';
import { setRolleAction } from './actions';

export function RolleWaehlen() {
  const [pending, startTransition] = useTransition();

  function choose(rolle: 'verkaeufer' | 'kaeufer') {
    startTransition(async () => {
      await setRolleAction(rolle);
    });
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <button
        type="button"
        disabled={pending}
        onClick={() => choose('verkaeufer')}
        className="group rounded-soft border border-stone bg-paper p-8 text-left hover:border-bronze hover:shadow-lift transition-all disabled:opacity-50"
      >
        <Building2 className="w-8 h-8 text-bronze mb-4" strokeWidth={1.5} />
        <h2 className="font-serif text-h3 text-navy mb-2">Ich verkaufe</h2>
        <p className="text-body-sm text-muted mb-6">
          Mein Unternehmen bei passare anbieten. Anonym, mit Bewertung und 0% Erfolgsprovision.
        </p>
        <span className="inline-flex items-center gap-1.5 text-caption text-bronze group-hover:text-bronze-ink">
          Inserat erstellen
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
        </span>
      </button>

      <button
        type="button"
        disabled={pending}
        onClick={() => choose('kaeufer')}
        className="group rounded-soft border border-stone bg-paper p-8 text-left hover:border-bronze hover:shadow-lift transition-all disabled:opacity-50"
      >
        <Search className="w-8 h-8 text-bronze mb-4" strokeWidth={1.5} />
        <h2 className="font-serif text-h3 text-navy mb-2">Ich kaufe</h2>
        <p className="text-body-sm text-muted mb-6">
          Schweizer KMU finden, Anfragen stellen, Datenraum einsehen — gratis starten.
        </p>
        <span className="inline-flex items-center gap-1.5 text-caption text-bronze group-hover:text-bronze-ink">
          Marktplatz erkunden
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
        </span>
      </button>
    </div>
  );
}
