'use client';

import { useState, useTransition } from 'react';
import { Building2, ArrowRight, Check, Search, Sparkles, X } from 'lucide-react';
import { completeBrokerOnboarding } from './actions';
import { FirmenSuche, type FirmaHit } from '@/components/zefix/FirmenSuche';
import { KANTONE } from '@/app/auth/constants';
import { BERATER_TIERS } from '@/data/pakete';

type Props = {
  userName: string;
  userEmail: string;
};

// Liste häufig benötigter Vorwahlen für CH-orientiertes Publikum.
const COUNTRY_CODES: Array<{ code: string; flag: string; label: string }> = [
  { code: '+41', flag: '🇨🇭', label: 'Schweiz' },
  { code: '+49', flag: '🇩🇪', label: 'Deutschland' },
  { code: '+43', flag: '🇦🇹', label: 'Österreich' },
  { code: '+39', flag: '🇮🇹', label: 'Italien' },
  { code: '+33', flag: '🇫🇷', label: 'Frankreich' },
  { code: '+423', flag: '🇱🇮', label: 'Liechtenstein' },
];

export function BrokerTunnelForm({ userName }: Props) {
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [showZefix, setShowZefix] = useState(false);

  const [form, setForm] = useState({
    agentur_name: '',
    slug: '',
    bio: '',
    website: '',
    telefon_vorwahl: '+41',
    telefon_nummer: '',
    kanton: '',
    full_name: userName,
    handelsregister_uid: '',
    paket: 'pro' as 'starter' | 'pro',
    interval: 'yearly' as 'monthly' | 'yearly',
  });

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[äöü]/g, (c) => ({ ä: 'ae', ö: 'oe', ü: 'ue' }[c] ?? c))
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40);
  }

  function applyZefixHit(hit: FirmaHit) {
    if (!hit.name) return;
    setForm((f) => ({
      ...f,
      agentur_name: hit.name ?? f.agentur_name,
      slug: f.slug || generateSlug(hit.name ?? ''),
      kanton: hit.kanton ?? f.kanton,
      handelsregister_uid: hit.uid ?? f.handelsregister_uid,
    }));
    setShowZefix(false);
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
      setError('Bitte wähle deinen Kanton.');
      return;
    }
    if (step === 1 && !form.slug.trim()) {
      setError('Bitte wähle eine Profil-URL.');
      return;
    }
    setError('');
    setStep(step + 1);
  }

  function submit() {
    setError('');
    const telefon = form.telefon_nummer.trim()
      ? `${form.telefon_vorwahl} ${form.telefon_nummer.trim()}`
      : '';

    startTransition(async () => {
      const result = await completeBrokerOnboarding({
        full_name: form.full_name || userName,
        agentur_name: form.agentur_name,
        slug: form.slug,
        bio: form.bio,
        website: form.website,
        telefon,
        kanton: form.kanton,
        paket: form.paket,
        interval: form.interval,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      window.location.href = `/api/stripe/broker-checkout?tier=${form.paket}&interval=${form.interval}`;
    });
  }

  const tierStarter = BERATER_TIERS.find((t) => t.id === 'starter')!;
  const tierPro = BERATER_TIERS.find((t) => t.id === 'pro')!;

  return (
    <div className="w-full">
      {/* Stepper */}
      <div className="flex items-center justify-center gap-2 mb-10">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-mono font-medium ${
                s < step
                  ? 'bg-success text-cream'
                  : s === step
                  ? 'bg-navy text-cream'
                  : 'bg-stone text-quiet'
              }`}
            >
              {s < step ? <Check className="w-4 h-4" strokeWidth={2.5} /> : s}
            </div>
            {s < 3 && <div className={`w-12 h-px ${s < step ? 'bg-success' : 'bg-stone'}`} />}
          </div>
        ))}
      </div>

      {/* ─── Step 1: Agentur-Daten ────────────────────────────────── */}
      {step === 1 && (
        <div className="rounded-card bg-paper border border-stone p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
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
            <div className="flex items-end justify-between mb-1.5">
              <label className="text-caption text-navy font-medium">Agentur-Name *</label>
              <button
                type="button"
                onClick={() => setShowZefix((s) => !s)}
                className="inline-flex items-center gap-1 text-[11px] text-bronze-ink hover:text-navy transition-colors"
              >
                <Search className="w-3 h-3" strokeWidth={1.5} />
                {showZefix ? 'Manuell eingeben' : 'Aus Handelsregister'}
              </button>
            </div>

            {showZefix ? (
              <div className="space-y-2">
                <FirmenSuche onSelect={applyZefixHit} placeholder="Agentur im Handelsregister suchen…" />
                {form.handelsregister_uid && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-success/5 border border-success/20 rounded-soft">
                    <Check className="w-3.5 h-3.5 text-success" strokeWidth={2} />
                    <span className="text-caption text-success">
                      UID übernommen: <span className="font-mono">{form.handelsregister_uid}</span>
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <input
                type="text"
                value={form.agentur_name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="z. B. Helvetic M&A Partners"
                className="w-full px-3.5 py-2.5 bg-cream border border-stone rounded-soft text-body-sm text-navy placeholder:text-quiet focus:outline-none focus:ring-2 focus:ring-bronze/30 focus:border-bronze transition-colors"
              />
            )}

            {showZefix && form.agentur_name && (
              <p className="mt-2 text-caption text-muted">
                Übernommen: <span className="text-navy font-medium">{form.agentur_name}</span>
              </p>
            )}
          </div>

          <div>
            <label className="text-caption text-navy font-medium block mb-1.5">Profil-URL *</label>
            <div className="flex items-center">
              <span className="px-3 py-2.5 bg-stone/30 border border-r-0 border-stone rounded-l-soft text-caption text-quiet">
                passare.ch/broker/
              </span>
              <input
                type="text"
                value={form.slug}
                onChange={(e) =>
                  setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })
                }
                className="flex-1 px-3.5 py-2.5 bg-cream border border-stone rounded-r-soft text-body-sm text-navy font-mono focus:outline-none focus:ring-2 focus:ring-bronze/30 focus:border-bronze transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-caption text-navy font-medium block mb-1.5">Kanton *</label>
              <select
                value={form.kanton}
                onChange={(e) => setForm({ ...form, kanton: e.target.value })}
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
              <label className="text-caption text-navy font-medium block mb-1.5">Telefon</label>
              <div className="flex">
                <select
                  value={form.telefon_vorwahl}
                  onChange={(e) => setForm({ ...form, telefon_vorwahl: e.target.value })}
                  className="px-2 py-2.5 bg-stone/20 border border-r-0 border-stone rounded-l-soft text-body-sm text-navy focus:outline-none focus:border-bronze"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  value={form.telefon_nummer}
                  onChange={(e) => setForm({ ...form, telefon_nummer: e.target.value })}
                  placeholder="44 123 45 67"
                  className="flex-1 min-w-0 px-3 py-2.5 bg-cream border border-stone rounded-r-soft text-body-sm text-navy placeholder:text-quiet focus:outline-none focus:ring-2 focus:ring-bronze/30 focus:border-bronze transition-colors"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-caption text-navy font-medium block mb-1.5">Website</label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://…"
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

      {/* ─── Step 2: Bio ──────────────────────────────────────────── */}
      {step === 2 && (
        <div className="rounded-card bg-paper border border-stone p-6 space-y-4">
          <h2 className="font-serif text-head-sm text-navy">Über deine Agentur</h2>
          <p className="text-body-sm text-muted">
            Beschreibe deine Expertise. Erscheint auf deinem öffentlichen Broker-Profil.
          </p>

          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={6}
            maxLength={1000}
            placeholder="z. B. Wir beraten KMU-Inhaber in der Deutschschweiz bei der Nachfolgeregelung. Branchenfokus auf Bau, Industrie und Dienstleistung. 30+ erfolgreiche Transaktionen seit 2015."
            className="w-full px-3.5 py-2.5 bg-cream border border-stone rounded-soft text-body-sm text-navy placeholder:text-quiet focus:outline-none focus:ring-2 focus:ring-bronze/30 focus:border-bronze transition-colors resize-none"
          />
          <p className="text-[11px] text-quiet text-right">{form.bio.length} / 1000</p>

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

      {/* ─── Step 3: Paket-Pipeline ───────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="font-serif text-head-md text-navy mb-2">Wähle dein Paket</h2>
            <p className="text-body-sm text-muted max-w-md mx-auto">
              Beide Pakete enthalten alle Verkaufs- und Käufer+-Funktionen. Jederzeit kündbar.
            </p>
          </div>

          {/* Interval-Toggle */}
          <div className="flex justify-center">
            <div className="inline-flex bg-paper border border-stone rounded-pill p-1">
              <button
                type="button"
                onClick={() => setForm({ ...form, interval: 'yearly' })}
                className={`px-5 py-1.5 rounded-pill text-caption font-medium transition-all ${
                  form.interval === 'yearly'
                    ? 'bg-navy text-cream shadow-sm'
                    : 'text-muted hover:text-navy'
                }`}
              >
                Jahresabo
                <span className="ml-1.5 text-[10px] text-bronze-ink font-mono">−2 Mt.</span>
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, interval: 'monthly' })}
                className={`px-5 py-1.5 rounded-pill text-caption font-medium transition-all ${
                  form.interval === 'monthly'
                    ? 'bg-navy text-cream shadow-sm'
                    : 'text-muted hover:text-navy'
                }`}
              >
                Monatsabo
              </button>
            </div>
          </div>

          {/* Tier-Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            <TierCard
              tier={tierStarter}
              selected={form.paket === 'starter'}
              interval={form.interval}
              onSelect={() => setForm({ ...form, paket: 'starter' })}
            />
            <TierCard
              tier={tierPro}
              selected={form.paket === 'pro'}
              interval={form.interval}
              recommended
              onSelect={() => setForm({ ...form, paket: 'pro' })}
            />
          </div>

          {error && (
            <p className="text-caption text-danger text-center">{error}</p>
          )}

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
              {pending ? (
                'Wird eingerichtet…'
              ) : (
                <>
                  Weiter zur Zahlung
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TierCard({
  tier,
  selected,
  interval,
  recommended,
  onSelect,
}: {
  tier: typeof BERATER_TIERS[number];
  selected: boolean;
  interval: 'monthly' | 'yearly';
  recommended?: boolean;
  onSelect: () => void;
}) {
  const isYearly = interval === 'yearly';
  const price = isYearly ? tier.preisJahr : tier.preisMonat;
  const priceUnit = isYearly ? '/ Jahr' : '/ Monat';
  const monthlyEquiv = isYearly ? Math.round(tier.preisJahr / 12) : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative rounded-card border p-6 text-left transition-all ${
        selected
          ? 'border-bronze bg-bronze/5 shadow-card'
          : 'border-stone bg-paper hover:border-bronze/40 hover:shadow-card'
      }`}
    >
      {recommended && (
        <span className="absolute -top-2.5 right-4 inline-flex items-center gap-1 px-2.5 py-0.5 bg-bronze text-cream rounded-pill text-[10px] font-medium uppercase tracking-wide">
          <Sparkles className="w-3 h-3" strokeWidth={2} />
          Empfohlen
        </span>
      )}

      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="overline text-quiet mb-1">{tier.label}</p>
          <p className="font-serif text-head-lg text-navy font-light font-tabular leading-none">
            CHF {price.toLocaleString('de-CH')}
          </p>
          <p className="text-caption text-muted mt-1.5">
            {priceUnit}
            {monthlyEquiv !== null && (
              <span className="ml-1.5 text-quiet">
                · entspricht CHF {monthlyEquiv}/Mt.
              </span>
            )}
          </p>
        </div>
        <div
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
            selected ? 'border-bronze bg-bronze' : 'border-stone'
          }`}
        >
          {selected && <Check className="w-3 h-3 text-cream" strokeWidth={3} />}
        </div>
      </div>

      <ul className="space-y-2">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-body-sm text-ink">
            <Check className="w-4 h-4 text-bronze flex-shrink-0 mt-0.5" strokeWidth={2} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </button>
  );
}
