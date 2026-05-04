'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ArrowRight, Check, Edit3 } from 'lucide-react';
import { FirmenSuche, type FirmaHit } from '@/components/zefix/FirmenSuche';
import { createMandatAction } from '../actions';

type Props = { remaining: number };

export function NewMandatWizard({ remaining }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [manual, setManual] = useState(false);

  // Pick-Mode: User sucht in Zefix oder gibt manuell ein
  const [pickedHit, setPickedHit] = useState<FirmaHit | null>(null);
  const [manualName, setManualName] = useState('');

  function selectByHit(hit: FirmaHit) {
    setPickedHit(hit);
    setError('');
  }

  function reset() {
    setPickedHit(null);
    setManualName('');
    setManual(false);
    setError('');
  }

  function submit() {
    setError('');
    const firmaName = manual ? manualName.trim() : pickedHit?.name ?? '';
    const kanton = manual ? null : pickedHit?.kanton ?? null;

    if (!firmaName) {
      setError('Bitte wähle eine Firma oder gib einen Namen ein.');
      return;
    }

    startTransition(async () => {
      const result = await createMandatAction({
        firma_name: firmaName,
        branche_id: null, // Branche kommt im InseratWizard (genau wie Verkäufer-Funnel)
        kanton,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.id) {
        router.push(`/dashboard/broker/mandate/${result.id}/edit`);
      }
    });
  }

  // ── Bestätigungs-Card wenn Hit ausgewählt ────────────────────────
  if (pickedHit) {
    return (
      <div className="space-y-5">
        <div className="rounded-card bg-paper border border-stone p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-card bg-bronze/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-bronze-ink" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-serif text-head-sm text-navy mb-1">{pickedHit.name}</p>
              <p className="text-caption text-quiet font-mono mb-2">
                {[pickedHit.uid, pickedHit.rechtsform].filter(Boolean).join(' · ')}
              </p>
              {(pickedHit.ort || pickedHit.kanton) && (
                <p className="text-caption text-muted">
                  {[pickedHit.ort, pickedHit.kanton].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={reset}
              className="text-caption text-quiet hover:text-navy transition-colors flex-shrink-0"
            >
              Andere Firma
            </button>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 bg-success/5 border border-success/20 rounded-soft">
            <Check className="w-3.5 h-3.5 text-success" strokeWidth={2} />
            <span className="text-caption text-success">
              Aus Handelsregister übernommen — Branche, Mitarbeiter, Umsatz und mehr füllst du im nächsten Schritt aus.
            </span>
          </div>
        </div>

        {error && (
          <div className="rounded-soft bg-danger/10 border border-danger/30 px-4 py-2.5">
            <p className="text-caption text-danger">{error}</p>
          </div>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-navy text-cream rounded-soft text-body-sm font-medium hover:bg-ink shadow-card hover:shadow-lift hover:-translate-y-px transition-all disabled:opacity-50"
        >
          {pending ? 'Mandat wird angelegt…' : (
            <>
              Mandat anlegen & weiter zum Inserat-Wizard
              <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </>
          )}
        </button>
      </div>
    );
  }

  // ── Manueller Modus ──────────────────────────────────────────────
  if (manual) {
    return (
      <div className="space-y-5">
        <div className="rounded-card bg-paper border border-stone p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-head-sm text-navy">Manuelle Erfassung</h2>
            <button
              type="button"
              onClick={reset}
              className="text-caption text-quiet hover:text-navy transition-colors"
            >
              ← Im Handelsregister suchen
            </button>
          </div>

          <p className="text-caption text-muted">
            Firma nicht im Handelsregister auffindbar? Trag den Namen manuell ein. Alle weiteren Daten füllen wir gemeinsam im nächsten Schritt aus.
          </p>

          <div>
            <label className="text-caption text-navy font-medium block mb-1.5">
              Firmenname *
              <span className="text-quiet font-normal ml-1">(intern, nie öffentlich)</span>
            </label>
            <input
              type="text"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder="z. B. Meier Maschinenbau AG"
              autoFocus
              className="w-full px-3.5 py-2.5 bg-cream border border-stone rounded-soft text-body-sm text-navy placeholder:text-quiet focus:outline-none focus:ring-2 focus:ring-bronze/30 focus:border-bronze transition-colors"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-soft bg-danger/10 border border-danger/30 px-4 py-2.5">
            <p className="text-caption text-danger">{error}</p>
          </div>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={pending || !manualName.trim()}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-navy text-cream rounded-soft text-body-sm font-medium hover:bg-ink transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? 'Mandat wird angelegt…' : (
            <>
              Mandat anlegen & weiter zum Inserat-Wizard
              <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </>
          )}
        </button>
      </div>
    );
  }

  // ── Default: Zefix-Suche ─────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div className="rounded-card bg-paper border border-stone p-6">
        <FirmenSuche onSelect={selectByHit} placeholder="Firma im Handelsregister suchen (Name oder UID) …" />
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setManual(true)}
          className="inline-flex items-center gap-1.5 text-body-sm text-bronze-ink hover:text-bronze underline-offset-4 hover:underline"
        >
          <Edit3 className="w-3.5 h-3.5" strokeWidth={1.5} />
          Firma nicht auffindbar? Manuell eintragen →
        </button>
      </div>

      <p className="text-caption text-quiet text-center">
        Du hast noch {remaining} {remaining === 1 ? 'Mandat' : 'Mandate'} verfügbar.
      </p>
    </div>
  );
}
