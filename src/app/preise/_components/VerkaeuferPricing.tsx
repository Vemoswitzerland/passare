'use client';

// ════════════════════════════════════════════════════════════════════
// Verkäufer-Pricing-Block für /preise
// ────────────────────────────────────────────────────────────────────
// 3 Pakete (Light/Pro/Premium) × 2 Laufzeiten (12M/6M)
//   + optionaler Klein-Inserat-Rabatt (25 % bei Verkaufspreis < 500k)
//   + 3 Powerups (Apple-Style Cards)
//
// Layout:
//   - Badge-Slot oben in eigener Zeile (kein Überlappen)
//   - Header zentriert mit Preis + Strike-Through bei Klein-Rabatt
//   - Feature-Zeilen mit grünem ✓ / rotem × / grüner Pille mit Wert
//   - Footer mit "Wählen"-Buttons
// ════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { Check, X, Zap, Mail, Clock } from 'lucide-react';
import {
  PAKETE_LIST,
  POWERUPS,
  KLEIN_INSERAT_SCHWELLE_CHF,
  KLEIN_INSERAT_RABATT_PCT,
  type Laufzeit,
  type PaketTier,
} from '@/data/pakete';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/ui/reveal';

const FEATURES_ROWS: Array<{
  label: string;
  values: Record<PaketTier, string | boolean>;
}> = [
  { label: '1 Inserat live', values: { light: true, pro: true, premium: true } },
  { label: 'Anfragen empfangen', values: { light: true, pro: true, premium: true } },
  { label: 'In-App-Chat mit Käufern', values: { light: true, pro: true, premium: true } },
  { label: 'Vollständige Statistik (Charts, Conversion)', values: { light: true, pro: true, premium: true } },
  { label: 'Datenraum', values: { light: false, pro: true, premium: true } },
  { label: 'Hervorhebung (Seite 1 + Top Branchenfilter)', values: { light: false, pro: '4× / Jahr', premium: '12× / Jahr' } },
  { label: 'Positionierung im Newsletter', values: { light: false, pro: false, premium: '2× / Jahr' } },
  { label: 'Mehrere Mitarbeiter onboarden', values: { light: false, pro: false, premium: 'bis 3' } },
  { label: 'Käuferprofil-Einsicht bei Anfragen', values: { light: false, pro: false, premium: true } },
];

export function VerkaeuferPricing() {
  const [laufzeit, setLaufzeit] = useState<Laufzeit>(12);
  const [klein, setKlein] = useState(false);

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────── */}
      <Reveal>
        <div className="mb-10 max-w-prose">
          <div className="flex items-center gap-4 mb-5">
            <span className="overline text-navy">Für Verkäufer</span>
            <span className="h-px flex-1 bg-stone" />
            <span className="font-mono text-[11px] text-quiet">einmalige Paketgebühr · 0 % Erfolgsprovision</span>
          </div>
          <h2 className="font-serif text-display-md text-navy font-light">
            Inserat Light · Pro · Premium.
          </h2>
        </div>
      </Reveal>

      {/* ── Toggles: Laufzeit + Klein-Rabatt ─────────────────────── */}
      <Reveal delay={0.05}>
        <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
          {/* Laufzeit */}
          <div className="inline-flex items-center gap-1 p-1 rounded-pill border border-stone bg-paper">
            {([6, 12] as Laufzeit[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLaufzeit(l)}
                className={`px-5 py-2 rounded-pill text-body-sm transition-all inline-flex items-center gap-2 ${
                  laufzeit === l ? 'bg-navy text-cream font-medium' : 'text-muted hover:text-navy'
                }`}
              >
                {l} Monate
                {l === 12 && (
                  <span className={`text-caption font-medium px-2 py-0.5 rounded-pill ${
                    laufzeit === l ? 'bg-bronze text-cream' : 'bg-bronze/15 text-bronze-ink'
                  }`}>
                    −20 % Rabatt
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Klein-Inserat-Rabatt */}
          <label className="inline-flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={klein}
              onChange={(e) => setKlein(e.target.checked)}
              className="sr-only peer"
            />
            <span className="relative w-10 h-6 bg-stone peer-checked:bg-bronze rounded-pill transition-colors after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:rounded-full after:bg-paper after:shadow-subtle after:transition-transform peer-checked:after:translate-x-4" />
            <span className="text-body-sm text-ink">
              Klein-Inserat-Rabatt <span className="font-medium text-bronze-ink">−{KLEIN_INSERAT_RABATT_PCT} %</span>
              <span className="text-quiet"> · Verkaufspreis &lt; CHF {KLEIN_INSERAT_SCHWELLE_CHF.toLocaleString('de-CH')}</span>
            </span>
          </label>
        </div>
      </Reveal>

      {/* ── Paket-Tabelle ────────────────────────────────────────── */}
      <Reveal delay={0.1}>
        <div className="border border-stone rounded-card overflow-hidden bg-paper">
          {/* Badge-Reihe — eigene Zeile mit fixer Höhe, kein Überlappen */}
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] bg-cream/50 border-b border-stone">
            <div />
            {PAKETE_LIST.map((p) => (
              <div key={p.id} className="border-l border-stone h-10 flex items-center justify-center px-2 overflow-hidden">
                {p.highlight && (
                  <span className="inline-flex items-center px-3 py-1 rounded-pill bg-navy text-cream text-caption font-medium tracking-wide whitespace-nowrap">
                    Beliebteste
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Header: Label + Preis */}
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] border-b border-stone">
            <div className="p-5">
              <p className="overline text-bronze-ink mb-2">Vergleich</p>
              <p className="text-caption text-muted leading-snug">
                {laufzeit === 12
                  ? 'Preise inkl. 20 % Laufzeit-Rabatt gegenüber 6 Monaten.'
                  : 'Standard-Laufzeit · 6 Monate.'}
                {klein && <><br /><span className="text-bronze-ink">Klein-Inserat-Rabatt 25 % aktiv.</span></>}
              </p>
            </div>
            {PAKETE_LIST.map((p) => {
              const preis = klein ? p.preisKlein[laufzeit] : p.preis[laufzeit];
              const preisRegulaer = p.preis[laufzeit];
              const proMonat = preis / laufzeit;
              return (
                <div key={p.id} className="p-5 text-center border-l border-stone">
                  <p className="overline text-quiet mb-3">{p.label}</p>
                  <p className="font-serif text-[1.85rem] text-navy font-light font-tabular leading-none">
                    CHF {preis.toLocaleString('de-CH')}
                  </p>
                  {klein && (
                    <p className="font-mono text-caption line-through text-quiet mt-1">
                      CHF {preisRegulaer.toLocaleString('de-CH')}
                    </p>
                  )}
                  <p className="text-caption text-quiet mt-2">
                    ≈ CHF {Math.round(proMonat).toLocaleString('de-CH')} / Mt
                  </p>
                </div>
              );
            })}
          </div>

          {/* Feature-Zeilen mit grün/rot */}
          {FEATURES_ROWS.map((row, i) => (
            <div
              key={row.label}
              className={`grid grid-cols-[1.5fr_1fr_1fr_1fr] ${
                i !== FEATURES_ROWS.length - 1 ? 'border-b border-stone/60' : ''
              } ${i % 2 === 1 ? 'bg-cream/30' : ''}`}
            >
              <div className="p-3.5 text-body-sm text-ink">{row.label}</div>
              {PAKETE_LIST.map((p) => (
                <FeatureCell key={p.id} value={row.values[p.id]} />
              ))}
            </div>
          ))}

          {/* CTA-Footer */}
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] border-t border-stone bg-cream/40">
            <div />
            {PAKETE_LIST.map((p) => (
              <div key={p.id} className="p-4 border-l border-stone">
                <Button
                  href={`/auth/register?paket=${p.id}&laufzeit=${laufzeit}${klein ? '&klein=1' : ''}`}
                  variant={p.highlight ? 'primary' : 'secondary'}
                  size="sm"
                  className="w-full justify-center"
                >
                  {p.label} wählen
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Klein-Rabatt-Hinweis */}
        {klein && (
          <p className="mt-4 text-body-sm text-muted leading-relaxed max-w-prose">
            <span className="text-bronze-ink font-medium">Hinweis:</span> Der Klein-Inserat-Rabatt
            wird automatisch im Wizard angewendet sobald du einen Kaufpreis unter
            CHF {KLEIN_INSERAT_SCHWELLE_CHF.toLocaleString('de-CH')} angibst.
            Eine spätere Erhöhung über diese Schwelle erfordert ein Upgrade auf das reguläre Paket.
          </p>
        )}
      </Reveal>

      {/* ── Powerups (Apple-Style 3 Cards) ────────────────────────── */}
      <Reveal delay={0.15}>
        <div className="mt-20">
          <div className="mb-8 max-w-prose">
            <div className="flex items-center gap-4 mb-5">
              <span className="overline text-navy">Optionale Boosts</span>
              <span className="h-px flex-1 bg-stone" />
              <span className="font-mono text-[11px] text-quiet">jederzeit zubuchbar</span>
            </div>
            <h3 className="font-serif text-head-lg text-navy font-light">
              Mach dein Inserat noch sichtbarer.
            </h3>
            <p className="mt-3 text-body text-muted">
              Drei Boosts. Einzeln zubuchbar. Keine Vertragsbindung.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {POWERUPS.map((pu) => (
              <PowerupCard key={pu.id} powerup={pu} />
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}

// ── Sub-Components ──────────────────────────────────────────────────

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
  return (
    <div className="p-3.5 border-l border-stone flex items-center justify-center">
      {content}
    </div>
  );
}

function PowerupCard({ powerup }: { powerup: typeof POWERUPS[number] }) {
  const Icon = powerup.icon === 'Zap' ? Zap : powerup.icon === 'Mail' ? Mail : Clock;
  return (
    <div className="rounded-card border border-stone bg-paper p-7 hover:shadow-subtle hover:-translate-y-0.5 transition-all">
      <div className="w-10 h-10 rounded-card bg-bronze/10 flex items-center justify-center mb-5">
        <Icon className="w-5 h-5 text-bronze-ink" strokeWidth={1.75} />
      </div>
      <h4 className="font-serif text-head-sm text-navy font-normal mb-1">{powerup.label}</h4>
      <p className="text-caption text-quiet mb-4">{powerup.einheit}</p>
      <p className="text-body-sm text-muted leading-relaxed mb-6">{powerup.beschreibung}</p>
      <p className="font-serif text-head-md text-navy font-light font-tabular">
        CHF {powerup.preis}
      </p>
      <p className="text-caption text-quiet mt-1">einmalig</p>
    </div>
  );
}
