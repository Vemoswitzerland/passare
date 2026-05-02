'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2, ArrowRight, Check, MapPin, Briefcase, Edit3, Search,
} from 'lucide-react';
import { FirmenSuche, type FirmaHit } from '@/components/zefix/FirmenSuche';
import { KANTONE } from '@/app/auth/constants';
import { BRANCHEN_LIST, matchBrancheFromPurpose } from '@/data/branchen-multiples';
import { createMandatAction } from '../actions';

type Props = { remaining: number };

type Step = 'pick' | 'review';

export function NewMandatWizard({ remaining }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<Step>('pick');
  const [error, setError] = useState('');
  const [manualMode, setManualMode] = useState(false);

  const [data, setData] = useState({
    firma_name: '',
    rechtsform: '',
    ort: '',
    kanton: '',
    branche_id: '',
    zefix_uid: '',
  });

  function applyZefixHit(hit: FirmaHit) {
    setData({
      firma_name: hit.name ?? '',
      rechtsform: hit.rechtsform ?? '',
      ort: hit.ort ?? '',
      kanton: hit.kanton ?? '',
      // Branche aus zefix-purpose nicht verfügbar im Hit — leer lassen, User kann setzen
      branche_id: '',
      zefix_uid: hit.uid ?? '',
    });
    setStep('review');
  }

  function startManual() {
    setManualMode(true);
    setData({ firma_name: '', rechtsform: '', ort: '', kanton: '', branche_id: '', zefix_uid: '' });
    setStep('review');
  }

  function back() {
    setStep('pick');
    setError('');
  }

  function submit() {
    setError('');
    if (!data.firma_name.trim()) {
      setError('Firmen-Name ist Pflicht.');
      return;
    }
    startTransition(async () => {
      const result = await createMandatAction({
        firma_name: data.firma_name,
        branche_id: data.branche_id || null,
        kanton: data.kanton || null,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.id) {
        router.push(`/dashboard/verkaeufer/inserat/${result.id}/edit?from=broker`);
      }
    });
  }

  // ─── Step 1: Pick (Zefix oder manuell) ─────────────────────────
  if (step === 'pick') {
    return (
      <div className="space-y-4">
        <div className="rounded-card bg-paper border border-stone p-6">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-5 h-5 text-bronze-ink" strokeWidth={1.5} />
            <h2 className="font-serif text-head-sm text-navy">Firma im Handelsregister suchen</h2>
          </div>
          <p className="text-body-sm text-muted mb-4">
            Tippe Name oder UID — wir übernehmen Rechtsform, Sitz, Kanton und schlagen die Branche vor.
          </p>
          <FirmenSuche onSelect={applyZefixHit} placeholder="Firma suchen (Name oder UID) …" />
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={startManual}
            className="inline-flex items-center gap-1.5 text-caption text-quiet hover:text-navy transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" strokeWidth={1.5} />
            Oder manuell ohne Handelsregister erfassen
          </button>
        </div>

        <p className="text-caption text-quiet text-center">
          Du hast noch {remaining} {remaining === 1 ? 'Mandat' : 'Mandate'} verfügbar.
        </p>
      </div>
    );
  }

  // ─── Step 2: Review / Edit ─────────────────────────────────────
  return (
    <div className="space-y-5">
      <div className="rounded-card bg-paper border border-stone p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-bronze-ink" strokeWidth={1.5} />
            <h2 className="font-serif text-head-sm text-navy">
              {manualMode ? 'Manuelle Erfassung' : 'Aus dem Handelsregister'}
            </h2>
          </div>
          <button
            type="button"
            onClick={back}
            className="text-caption text-quiet hover:text-navy transition-colors"
          >
            ← Andere Firma
          </button>
        </div>

        {data.zefix_uid && (
          <div className="flex items-center gap-2 px-3 py-2 bg-success/5 border border-success/20 rounded-soft">
            <Check className="w-3.5 h-3.5 text-success" strokeWidth={2} />
            <span className="text-caption text-success">
              Aus Handelsregister übernommen · UID{' '}
              <span className="font-mono">{data.zefix_uid}</span>
            </span>
          </div>
        )}

        <div>
          <label className="text-caption text-navy font-medium block mb-1.5">Firma *</label>
          <input
            type="text"
            value={data.firma_name}
            onChange={(e) => setData({ ...data, firma_name: e.target.value })}
            placeholder="z. B. Meier Maschinenbau AG"
            className="w-full px-3.5 py-2.5 bg-cream border border-stone rounded-soft text-body-sm text-navy placeholder:text-quiet focus:outline-none focus:ring-2 focus:ring-bronze/30 focus:border-bronze transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-caption text-navy font-medium block mb-1.5">Rechtsform</label>
            <input
              type="text"
              value={data.rechtsform}
              onChange={(e) => setData({ ...data, rechtsform: e.target.value })}
              placeholder="AG / GmbH / …"
              className="w-full px-3.5 py-2.5 bg-cream border border-stone rounded-soft text-body-sm text-navy placeholder:text-quiet focus:outline-none focus:ring-2 focus:ring-bronze/30 focus:border-bronze transition-colors"
            />
          </div>
          <div>
            <label className="text-caption text-navy font-medium block mb-1.5">
              <MapPin className="w-3 h-3 inline mr-1" strokeWidth={1.5} />
              Sitz / Gemeinde
            </label>
            <input
              type="text"
              value={data.ort}
              onChange={(e) => setData({ ...data, ort: e.target.value })}
              placeholder="z. B. Zürich"
              className="w-full px-3.5 py-2.5 bg-cream border border-stone rounded-soft text-body-sm text-navy placeholder:text-quiet focus:outline-none focus:ring-2 focus:ring-bronze/30 focus:border-bronze transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-caption text-navy font-medium block mb-1.5">Kanton</label>
            <select
              value={data.kanton}
              onChange={(e) => setData({ ...data, kanton: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-cream border border-stone rounded-soft text-body-sm text-navy focus:outline-none focus:ring-2 focus:ring-bronze/30 focus:border-bronze transition-colors"
            >
              <option value="">— Wählen —</option>
              {KANTONE.map(([code, name]) => (
                <option key={code} value={code}>
                  {code} — {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-caption text-navy font-medium block mb-1.5">
              <Briefcase className="w-3 h-3 inline mr-1" strokeWidth={1.5} />
              Branche
            </label>
            <select
              value={data.branche_id}
              onChange={(e) => setData({ ...data, branche_id: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-cream border border-stone rounded-soft text-body-sm text-navy focus:outline-none focus:ring-2 focus:ring-bronze/30 focus:border-bronze transition-colors"
            >
              <option value="">— Wählen (kann später) —</option>
              {BRANCHEN_LIST.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-caption text-quiet">
          Im nächsten Schritt füllen wir gemeinsam Teaser, Kennzahlen, Datenraum und mehr aus.
        </p>
      </div>

      {error && (
        <div className="rounded-soft bg-danger/10 border border-danger/30 px-4 py-2.5">
          <p className="text-caption text-danger">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={back}
          className="px-5 py-2.5 border border-stone rounded-soft text-body-sm text-navy font-medium hover:bg-stone/30 transition-colors"
        >
          Zurück
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={pending || !data.firma_name.trim()}
          className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-navy text-cream rounded-soft text-body-sm font-medium hover:bg-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? 'Wird erstellt…' : (
            <>
              Mandat anlegen & weiter zum Wizard
              <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
