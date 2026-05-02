'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ArrowRight, Check, Globe, Phone } from 'lucide-react';
import { completeBrokerOnboarding } from './actions';

type Props = {
  userName: string;
  userEmail: string;
};

export function BrokerTunnelForm({ userName, userEmail }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    agentur_name: '',
    slug: '',
    bio: '',
    website: '',
    telefon: '',
    kanton: '',
    full_name: userName,
    paket: 'starter' as 'starter' | 'pro',
    interval: 'monthly' as 'monthly' | 'yearly',
  });

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[äöü]/g, (c) => ({ ä: 'ae', ö: 'oe', ü: 'ue' }[c] ?? c))
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40);
  }

  function handleNameChange(name: string) {
    setForm({
      ...form,
      agentur_name: name,
      slug: form.slug || generateSlug(name),
    });
  }

  function next() {
    if (step === 1 && !form.agentur_name.trim()) {
      setError('Bitte gib einen Agentur-Namen ein.');
      return;
    }
    if (step === 1 && !form.kanton.trim()) {
      setError('Bitte gib deinen Kanton an.');
      return;
    }
    setError('');
    setStep(step + 1);
  }

  function submit() {
    setError('');
    startTransition(async () => {
      const result = await completeBrokerOnboarding({
        full_name: form.full_name || userName,
        agentur_name: form.agentur_name,
        slug: form.slug,
        bio: form.bio,
        website: form.website,
        telefon: form.telefon,
        kanton: form.kanton,
        paket: form.paket,
        interval: form.interval,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      // Redirect to Stripe checkout
      router.push(`/api/stripe/broker-checkout?tier=${form.paket}&interval=${form.interval}`);
    });
  }

  return (
    <div>
      {/* Stepper */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-mono font-medium ${
              s < step ? 'bg-success text-cream' :
              s === step ? 'bg-navy text-cream' :
              'bg-stone text-quiet'
            }`}>
              {s < step ? <Check className="w-4 h-4" strokeWidth={2.5} /> : s}
            </div>
            {s < 3 && <div className={`w-8 h-px ${s < step ? 'bg-success' : 'bg-stone'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Brand-Daten */}
      {step === 1 && (
        <div className="rounded-card bg-paper border border-stone p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-5 h-5 text-bronze-ink" strokeWidth={1.5} />
            <h2 className="font-serif text-head-sm text-navy">Agentur-Daten</h2>
          </div>

          <div>
            <label className="text-caption text-navy font-medium block mb-1.5">Dein Name</label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-cream border border-stone rounded-soft text-body-sm text-navy focus:outline-none focus:ring-2 focus:ring-bronze/30 focus:border-bronze transition-colors"
            />
          </div>

          <div>
            <label className="text-caption text-navy font-medium block mb-1.5">Agentur-Name *</label>
            <input
              type="text"
              value={form.agentur_name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="z. B. Helvetic M&A Partners"
              className="w-full px-3.5 py-2.5 bg-cream border border-stone rounded-soft text-body-sm text-navy placeholder:text-quiet focus:outline-none focus:ring-2 focus:ring-bronze/30 focus:border-bronze transition-colors"
            />
          </div>

          <div>
            <label className="text-caption text-navy font-medium block mb-1.5">Profil-URL</label>
            <div className="flex items-center">
              <span className="px-3 py-2.5 bg-stone/30 border border-r-0 border-stone rounded-l-soft text-caption text-quiet">
                passare.ch/broker/
              </span>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                className="flex-1 px-3.5 py-2.5 bg-cream border border-stone rounded-r-soft text-body-sm text-navy font-mono focus:outline-none focus:ring-2 focus:ring-bronze/30 focus:border-bronze transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-caption text-navy font-medium block mb-1.5">Kanton *</label>
              <input
                type="text"
                value={form.kanton}
                onChange={(e) => setForm({ ...form, kanton: e.target.value.toUpperCase().slice(0, 2) })}
                placeholder="ZH"
                maxLength={2}
                className="w-full px-3.5 py-2.5 bg-cream border border-stone rounded-soft text-body-sm text-navy placeholder:text-quiet focus:outline-none focus:ring-2 focus:ring-bronze/30 focus:border-bronze transition-colors"
              />
            </div>
            <div>
              <label className="text-caption text-navy font-medium block mb-1.5">
                <Phone className="w-3 h-3 inline mr-1" strokeWidth={1.5} />
                Telefon
              </label>
              <input
                type="tel"
                value={form.telefon}
                onChange={(e) => setForm({ ...form, telefon: e.target.value })}
                placeholder="+41 ..."
                className="w-full px-3.5 py-2.5 bg-cream border border-stone rounded-soft text-body-sm text-navy placeholder:text-quiet focus:outline-none focus:ring-2 focus:ring-bronze/30 focus:border-bronze transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-caption text-navy font-medium block mb-1.5">
              <Globe className="w-3 h-3 inline mr-1" strokeWidth={1.5} />
              Website (optional)
            </label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://..."
              className="w-full px-3.5 py-2.5 bg-cream border border-stone rounded-soft text-body-sm text-navy placeholder:text-quiet focus:outline-none focus:ring-2 focus:ring-bronze/30 focus:border-bronze transition-colors"
            />
          </div>

          {error && <p className="text-caption text-danger">{error}</p>}

          <button
            type="button"
            onClick={next}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-navy text-cream rounded-soft text-body-sm font-medium hover:bg-ink transition-colors"
          >
            Weiter <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      )}

      {/* Step 2: Bio / Beschreibung */}
      {step === 2 && (
        <div className="rounded-card bg-paper border border-stone p-6 space-y-4">
          <h2 className="font-serif text-head-sm text-navy">Über deine Agentur</h2>
          <p className="text-body-sm text-muted">
            Beschreibe deine Expertise. Dies erscheint auf deinem öffentlichen Profil.
          </p>

          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={5}
            maxLength={1000}
            placeholder="z. B. Wir beraten KMU-Inhaber in der Deutschschweiz bei der Nachfolgeregelung…"
            className="w-full px-3.5 py-2.5 bg-cream border border-stone rounded-soft text-body-sm text-navy placeholder:text-quiet focus:outline-none focus:ring-2 focus:ring-bronze/30 focus:border-bronze transition-colors resize-none"
          />
          <p className="text-[11px] text-quiet">{form.bio.length} / 1000</p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-5 py-2.5 border border-stone rounded-soft text-body-sm text-navy font-medium hover:bg-stone/30 transition-colors"
            >
              Zurück
            </button>
            <button
              type="button"
              onClick={next}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-navy text-cream rounded-soft text-body-sm font-medium hover:bg-ink transition-colors"
            >
              Weiter <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Paket wählen */}
      {step === 3 && (
        <div className="rounded-card bg-paper border border-stone p-6 space-y-5">
          <h2 className="font-serif text-head-sm text-navy">Paket wählen</h2>
          <p className="text-body-sm text-muted">
            Beide Pakete enthalten alle Verkaufs- und Käufer+-Funktionen.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, paket: 'starter' })}
              className={`p-4 rounded-card border text-left transition-all ${
                form.paket === 'starter' ? 'border-bronze bg-bronze/5' : 'border-stone hover:border-bronze/40'
              }`}
            >
              <p className="overline text-quiet mb-1">Starter</p>
              <p className="font-serif text-head-md text-navy font-light">CHF 290</p>
              <p className="text-caption text-muted mt-1">/ Monat</p>
              <p className="text-[11px] text-bronze-ink mt-2">Bis 5 Mandate</p>
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, paket: 'pro' })}
              className={`p-4 rounded-card border text-left transition-all ${
                form.paket === 'pro' ? 'border-bronze bg-bronze/5' : 'border-stone hover:border-bronze/40'
              }`}
            >
              <p className="overline text-quiet mb-1">Pro</p>
              <p className="font-serif text-head-md text-navy font-light">CHF 890</p>
              <p className="text-caption text-muted mt-1">/ Monat</p>
              <p className="text-[11px] text-bronze-ink mt-2">Bis 25 Mandate + Team</p>
            </button>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, interval: form.interval === 'monthly' ? 'yearly' : 'monthly' })}
              className="px-4 py-2 border border-stone rounded-soft text-caption text-navy font-medium hover:bg-stone/30 transition-colors"
            >
              {form.interval === 'monthly' ? 'Zum Jahresabo' : 'Zum Monatsabo'}
            </button>
          </div>

          {form.interval === 'yearly' && (
            <p className="text-caption text-success font-medium">
              Jahresabo: CHF {form.paket === 'starter' ? "2'900" : "8'900"} / Jahr (2 Monate gratis)
            </p>
          )}

          {error && <p className="text-caption text-danger">{error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-5 py-2.5 border border-stone rounded-soft text-body-sm text-navy font-medium hover:bg-stone/30 transition-colors"
            >
              Zurück
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={pending}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-navy text-cream rounded-soft text-body-sm font-medium hover:bg-ink transition-colors disabled:opacity-50"
            >
              {pending ? 'Wird eingerichtet…' : 'Weiter zur Zahlung'}
              <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
