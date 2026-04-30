'use client';

// ════════════════════════════════════════════════════════════════════
// Verkäufer-Pricing-Block für /preise
// ────────────────────────────────────────────────────────────────────
// 3 Pakete (Light/Pro/Premium) × 2 Laufzeiten (12M/6M)
//   + optionaler Klein-Inserat-Rabatt (25 % bei Verkaufspreis < 500k)
//   + 3 Powerups (Apple-Style Cards)
// ════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { Check, Zap, Mail, Clock } from 'lucide-react';
import {
  PAKETE,
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
  {
    label: '1 Inserat live',
    values: { light: true, pro: true, premium: true },
  },
  {
    label: 'Anfragen empfangen',
    values: { light: true, pro: true, premium: true },
  },
  {
    label: 'In-App-Chat mit Käufern',
    values: { light: true, pro: true, premium: true },
  },
  {
    label: 'Vollständige Statistik (Charts, Conversion)',
    values: { light: true, pro: true, premium: true },
  },
  {
    label: 'Datenraum',
    values: { light: false, pro: true, premium: true },
  },
  {
    label: 'Hervorhebung (Seite 1 + Top Branchenfilter)',
    values: { light: false, pro: '4× / Jahr', premium: '12× / Jahr' },
  },
  {
    label: 'Positionierung im Newsletter',
    values: { light: false, pro: false, premium: '2× / Jahr' },
  },
  {
    label: 'Mehrere Mitarbeiter onboarden',
    values: { light: false, pro: false, premium: 'bis 3' },
  },
  {
    label: 'Käuferprofil-Einsicht bei Anfragen',
    values: { light: false, pro: false, premium: true },
  },
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
            {([12, 6] as Laufzeit[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLaufzeit(l)}
                className={`px-5 py-2 rounded-pill text-body-sm transition-all ${
                  laufzeit === l ? 'bg-navy text-cream font-medium' : 'text-muted hover:text-navy'
                }`}
              >
                {l} Monate {l === 6 && <span className="text-caption opacity-70">+20 %</span>}
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
          {/* Header */}
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] border-b border-stone">
            <div className="p-6"></div>
            {PAKETE_LIST.map((p) => (
              <PlanHeader
                key={p.id}
                name={p.label}
                price={`CHF ${(klein ? p.preisKlein[laufzeit] : p.preis[laufzeit]).toLocaleString('de-CH')}`}
                note={`${laufzeit} Monate`}
                strike={klein ? `CHF ${p.preis[laufzeit].toLocaleString('de-CH')}` : null}
                highlight={p.highlight}
              />
            ))}
          </div>

          {/* Feature-Rows */}
          {FEATURES_ROWS.map((r, i) => (
            <div
              key={r.label}
              className={`grid grid-cols-[1.5fr_1fr_1fr_1fr] ${
                i !== FEATURES_ROWS.length - 1 ? 'border-b border-stone' : ''
              } ${i % 2 === 1 ? 'bg-cream/30' : ''}`}
            >
              <div className="p-4 text-body-sm text-ink">{r.label}</div>
              {PAKETE_LIST.map((p) => (
                <Cell key={p.id} value={r.values[p.id]} highlight={p.highlight} />
              ))}
            </div>
          ))}

          {/* CTA */}
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] border-t border-stone bg-cream/50">
            <div className="p-4"></div>
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

function PlanHeader({
  name,
  price,
  note,
  strike,
  highlight,
}: {
  name: string;
  price: string;
  note: string;
  strike: string | null;
  highlight?: boolean;
}) {
  return (
    <div className={`p-6 border-l border-stone ${highlight ? 'bg-navy text-cream' : ''}`}>
      {highlight && (
        <p className="font-mono text-[10px] uppercase tracking-widest text-bronze mb-1">Beliebt</p>
      )}
      <p className={`font-mono text-[11px] uppercase tracking-widest ${highlight ? 'text-cream/60' : 'text-quiet'} mb-1.5`}>
        Paket
      </p>
      <p className={`font-serif text-head-md ${highlight ? 'text-cream' : 'text-navy'} font-normal`}>{name}</p>
      <div className="mt-3 flex items-baseline gap-2 flex-wrap">
        <p className={`font-serif text-display-sm ${highlight ? 'text-cream' : 'text-navy'} font-light font-tabular`}>
          {price}
        </p>
        {strike && (
          <p className={`font-mono text-caption line-through ${highlight ? 'text-cream/50' : 'text-quiet'}`}>
            {strike}
          </p>
        )}
      </div>
      <p className={`font-mono text-[11px] uppercase tracking-widest ${highlight ? 'text-cream/60' : 'text-quiet'} mt-1`}>
        {note}
      </p>
    </div>
  );
}

function Cell({ value, highlight }: { value: string | boolean; highlight?: boolean }) {
  let content: React.ReactNode;
  if (typeof value === 'boolean') {
    content = value ? <Check className="w-4 h-4 inline-block text-bronze" strokeWidth={2.5} /> : <span className="text-quiet">—</span>;
  } else {
    content = value;
  }
  return (
    <div
      className={`p-4 border-l border-stone text-center font-mono text-[13px] ${
        highlight ? 'text-navy font-medium bg-cream/40' : 'text-muted'
      }`}
    >
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
