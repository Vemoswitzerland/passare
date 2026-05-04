'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Building2, ArrowRight, ArrowLeft, Check, Search, Sparkles, X } from 'lucide-react';
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
  // Standard ist Handelsregister-Suche (faster, robuster) — manuell ist Fallback.
  const [showZefix, setShowZefix] = useState(true);

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
    // Wenn der User aus dem Handelsregister einen Hit nimmt, soll der
    // Slug AUS DEM HIT-NAMEN regeneriert werden — nicht der bisherige
    // Tippfehler-Stub stehen bleiben.
    setForm((f) => ({
      ...f,
      agentur_name: hit.name ?? f.agentur_name,
      slug: generateSlug(hit.name ?? ''),
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
    if (step === 1) {
      if (!form.agentur_name.trim()) {
        setError('Bitte gib einen Agentur-Namen ein.');
        return;
      }
      if (!form.kanton.trim()) {
        setError('Bitte wähle deinen Kanton.');
        return;
      }
      if (!form.slug.trim() || form.slug.trim().length < 3) {
        setError('Bitte wähle eine gültige Profil-URL (mindestens 3 Zeichen).');
        return;
      }
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
        handelsregister_uid: form.handelsregister_uid || null,
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
        <div className="max-w-lg mx-auto rounded-card bg-paper border border-stone p-6 space-y-5">
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

          <div className="flex gap-3">
            <Link
              href="/broker"
              className="inline-flex items-center gap-1.5 px-5 py-3 border border-stone rounded-soft text-body-sm text-navy font-medium hover:bg-stone/30 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
              Abbrechen
            </Link>
            <button
              type="button"
              onClick={next}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-navy text-cream rounded-soft text-body-sm font-medium hover:bg-ink transition-colors"
            >
              Weiter <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 2: Bio ──────────────────────────────────────────── */}
      {step === 2 && (
        <div className="max-w-lg mx-auto rounded-card bg-paper border border-stone p-6 space-y-4">
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

      {/* ─── Step 3: Paket-Vergleich (Verkäufer-Style) ────────────── */}
      {step === 3 && (
        <div className="space-y-8">
          <div className="max-w-prose">
            <div className="flex items-center gap-4 mb-5">
              <span className="overline text-navy">Pakete</span>
              <span className="h-px flex-1 bg-stone" />
              <span className="font-mono text-[11px] text-quiet">jederzeit kündbar · 0 % Erfolgsprovision</span>
            </div>
            <h2 className="font-serif text-display-md text-navy font-light">
              Starter oder Pro.
            </h2>
            <p className="mt-3 text-body-sm text-muted leading-relaxed">
              Beide Pakete enthalten alle Verkaufs- und Käufer+-Funktionen. Was die zwei Pakete unterscheidet:
            </p>
          </div>

          {/* Interval-Toggle */}
          <div className="inline-flex items-center gap-1 p-1 rounded-pill border border-stone bg-paper">
            <button
              type="button"
              onClick={() => setForm({ ...form, interval: 'yearly' })}
              className={`px-5 py-2 rounded-pill text-body-sm transition-all inline-flex items-center gap-2 ${
                form.interval === 'yearly' ? 'bg-navy text-cream font-medium' : 'text-muted hover:text-navy'
              }`}
            >
              Jahresabo
              <span
                className={`text-caption font-medium px-2 py-0.5 rounded-pill ${
                  form.interval === 'yearly' ? 'bg-bronze text-cream' : 'bg-bronze/15 text-bronze-ink'
                }`}
              >
                −2 Monate
              </span>
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, interval: 'monthly' })}
              className={`px-5 py-2 rounded-pill text-body-sm transition-all ${
                form.interval === 'monthly' ? 'bg-navy text-cream font-medium' : 'text-muted hover:text-navy'
              }`}
            >
              Monatsabo
            </button>
          </div>

          {/* Vergleichs-Tabelle — stabil, kein Layout-Sprung beim Klicken.
              Selection wird via Hintergrund-Schicht im Outer-Container und
              Style des CTA-Buttons gezeigt — Header bleibt fix. */}
          <div className="border border-stone rounded-card overflow-hidden bg-paper">
            {/* Badge-Reihe oben — feste Höhe, "Empfohlen" IMMER in Pro-Spalte */}
            <div className="grid grid-cols-[1.5fr_1fr_1fr] bg-cream/50 border-b border-stone">
              <div className="h-10" />
              <div className="border-l border-stone h-10" />
              <div className="border-l border-stone h-10 flex items-center justify-center">
                <span className="inline-flex items-center px-3 py-1 rounded-pill bg-navy text-cream text-caption font-medium tracking-wide whitespace-nowrap">
                  Empfohlen
                </span>
              </div>
            </div>

            {/* Header: Vergleich + Preise — KEIN Background-Wechsel beim Klick.
                Pro-Spalte hat IMMER bg-cream/30, der "gewählt"-State zeigt
                sich nur via Ring um den ganzen Tier-Header. */}
            <div className="grid grid-cols-[1.5fr_1fr_1fr] border-b border-stone">
              <div className="p-5">
                <p className="overline text-bronze-ink mb-2">Vergleich</p>
                <p className="text-caption text-muted leading-snug">
                  {form.interval === 'yearly'
                    ? 'Preise inkl. 2 Monate Rabatt im Jahresabo.'
                    : 'Standard · Monatsabo.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setForm({ ...form, paket: 'starter' })}
                className="p-5 text-center border-l border-stone hover:bg-cream/40 transition-colors"
              >
                <p className="overline text-quiet mb-3">Starter</p>
                <p className="font-serif text-[1.85rem] text-navy font-light font-tabular leading-none">
                  CHF {form.interval === 'yearly' ? "2'900" : '290'}
                </p>
                <p className="text-caption text-quiet mt-2">
                  ≈ CHF {form.interval === 'yearly' ? '242' : '290'} / Mt
                </p>
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, paket: 'pro' })}
                className="p-5 text-center border-l border-stone bg-cream/30 hover:bg-cream/50 transition-colors"
              >
                <p className="overline text-quiet mb-3">Pro</p>
                <p className="font-serif text-[1.85rem] text-navy font-light font-tabular leading-none">
                  CHF {form.interval === 'yearly' ? "8'900" : '890'}
                </p>
                <p className="text-caption text-quiet mt-2">
                  ≈ CHF {form.interval === 'yearly' ? '742' : '890'} / Mt
                </p>
              </button>
            </div>

            {/* Differenzierer-Zeilen mit Zebra */}
            {[
              { label: 'Aktive Mandate gleichzeitig', starter: 'bis 5' as const, pro: 'bis 25' as const },
              { label: 'Hervorhebung pro Mandat', starter: '4× / Jahr' as const, pro: '12× / Jahr' as const },
              { label: 'Newsletter-Positionierung pro Mandat', starter: false as const, pro: '2× / Jahr' as const },
              { label: 'Mehrere Mitarbeiter onboarden', starter: false as const, pro: 'bis 5' as const },
            ].map((r, i, arr) => (
              <div
                key={r.label}
                className={`grid grid-cols-[1.5fr_1fr_1fr] ${
                  i !== arr.length - 1 ? 'border-b border-stone/60' : ''
                } ${i % 2 === 1 ? 'bg-cream/30' : ''}`}
              >
                <div className="p-3.5 text-body-sm text-ink">{r.label}</div>
                <FeatureCell value={r.starter} />
                <FeatureCell value={r.pro} />
              </div>
            ))}

            {/* CTA-Footer — feste Button-Texte, nur Stil ändert sich.
                Gewählt = Navy primary. Nicht gewählt = secondary outline. */}
            <div className="grid grid-cols-[1.5fr_1fr_1fr] border-t border-stone bg-cream/40">
              <div className="p-4" />
              <div className="p-4 border-l border-stone">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, paket: 'starter' })}
                  aria-pressed={form.paket === 'starter'}
                  className={`w-full px-4 py-2 rounded-soft text-caption font-medium border transition-colors ${
                    form.paket === 'starter'
                      ? 'bg-navy text-cream border-navy'
                      : 'bg-paper text-navy border-stone hover:bg-stone/30'
                  }`}
                >
                  Starter wählen
                </button>
              </div>
              <div className="p-4 border-l border-stone">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, paket: 'pro' })}
                  aria-pressed={form.paket === 'pro'}
                  className={`w-full px-4 py-2 rounded-soft text-caption font-medium border transition-colors ${
                    form.paket === 'pro'
                      ? 'bg-navy text-cream border-navy'
                      : 'bg-paper text-navy border-stone hover:bg-stone/30'
                  }`}
                >
                  Pro wählen
                </button>
              </div>
            </div>
          </div>

          {/* Selection-Bestätigung dezent unter der Tabelle — kein Reflow */}
          <div className="text-caption text-muted">
            Aktuelle Wahl:{' '}
            <span className="text-navy font-medium">
              {form.paket === 'pro' ? 'Pro' : 'Starter'}
              {' · '}
              {form.interval === 'yearly' ? 'Jahresabo' : 'Monatsabo'}
            </span>
          </div>

          {error && (
            <div className="rounded-soft bg-danger/10 border border-danger/30 px-4 py-2.5">
              <p className="text-caption text-danger">{error}</p>
            </div>
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
                  {form.paket === 'pro' ? 'Pro' : 'Starter'} buchen ·{' '}
                  CHF {form.paket === 'pro'
                    ? form.interval === 'yearly' ? "8'900" : '890'
                    : form.interval === 'yearly' ? "2'900" : '290'}
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

function FeatureCell({ value }: { value: string | boolean }) {
  let content: React.ReactNode;
  if (value === true) {
    content = (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-success/15 text-success">
        <Check className="w-4 h-4" strokeWidth={2.5} />
      </span>
    );
  } else if (value === false) {
    content = (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-danger/10 text-danger">
        <X className="w-3.5 h-3.5" strokeWidth={3} />
      </span>
    );
  } else {
    content = (
      <span className="inline-flex items-center px-2.5 py-1 rounded-pill bg-success/10 text-success text-caption font-mono font-medium">
        ✓ {value}
      </span>
    );
  }
  return <div className="p-3.5 text-center border-l border-stone/60">{content}</div>;
}
