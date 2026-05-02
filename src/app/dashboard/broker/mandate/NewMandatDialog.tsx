'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { createMandatAction } from './actions';

export function NewMandatDialog() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [firmaName, setFirmaName] = useState('');
  const [branche, setBranche] = useState('');
  const [kanton, setKanton] = useState('');
  const [error, setError] = useState('');

  function close() {
    router.push('/dashboard/broker/mandate');
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    startTransition(async () => {
      const result = await createMandatAction({ firma_name: firmaName, branche_id: branche || null, kanton: kanton || null });
      if (result.error) {
        setError(result.error);
      } else if (result.id) {
        router.push(`/dashboard/verkaeufer/inserat/${result.id}/edit?from=broker`);
      }
    });
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm animate-fade-in" onClick={close} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-paper border border-stone rounded-card shadow-lift p-6 md:p-8 w-full max-w-md pointer-events-auto animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-head-md text-navy">Neues Mandat</h2>
            <button type="button" onClick={close} className="p-1.5 rounded-soft hover:bg-stone/40 transition-colors">
              <X className="w-5 h-5 text-quiet" strokeWidth={1.5} />
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-caption text-navy font-medium block mb-1.5">Firma / Mandat-Name *</label>
              <input
                type="text"
                value={firmaName}
                onChange={(e) => setFirmaName(e.target.value)}
                placeholder="z. B. Meier Maschinenbau AG"
                required
                className="w-full px-3.5 py-2.5 bg-cream border border-stone rounded-soft text-body-sm text-navy placeholder:text-quiet focus:outline-none focus:ring-2 focus:ring-bronze/30 focus:border-bronze transition-colors"
              />
            </div>
            <div>
              <label className="text-caption text-navy font-medium block mb-1.5">Branche (optional)</label>
              <input
                type="text"
                value={branche}
                onChange={(e) => setBranche(e.target.value)}
                placeholder="z. B. maschinenbau"
                className="w-full px-3.5 py-2.5 bg-cream border border-stone rounded-soft text-body-sm text-navy placeholder:text-quiet focus:outline-none focus:ring-2 focus:ring-bronze/30 focus:border-bronze transition-colors"
              />
            </div>
            <div>
              <label className="text-caption text-navy font-medium block mb-1.5">Kanton (optional)</label>
              <input
                type="text"
                value={kanton}
                onChange={(e) => setKanton(e.target.value.toUpperCase().slice(0, 2))}
                placeholder="z. B. ZH"
                maxLength={2}
                className="w-full px-3.5 py-2.5 bg-cream border border-stone rounded-soft text-body-sm text-navy placeholder:text-quiet focus:outline-none focus:ring-2 focus:ring-bronze/30 focus:border-bronze transition-colors"
              />
            </div>

            {error && (
              <p className="text-caption text-danger">{error}</p>
            )}

            <button
              type="submit"
              disabled={pending || !firmaName.trim()}
              className="w-full px-5 py-2.5 bg-navy text-cream rounded-soft text-body-sm font-medium hover:bg-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pending ? 'Wird erstellt…' : 'Mandat erstellen'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
