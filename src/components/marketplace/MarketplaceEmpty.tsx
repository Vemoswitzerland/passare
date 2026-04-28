/**
 * passare.ch — EmptyState für Marktplatz / Karte / Käufer-Dashboard
 *
 * Wird angezeigt wenn die DB (noch) keine live-Inserate enthält.
 * Statt Fake-Daten bekommt der Besucher zwei klare Optionen:
 *   1. Selber ein Inserat aufgeben (Verkäufer-Funnel)
 *   2. Suchprofil anlegen — wir benachrichtigen wenn was reinkommt
 */

import Link from 'next/link';
import { ArrowRight, FileSearch, BellRing, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/ui/reveal';

type Variant = 'marktplatz' | 'atlas' | 'kaeufer-digest' | 'kaeufer-favoriten';

type Props = {
  variant?: Variant;
  /** Optionale Override-Headline */
  headline?: string;
  /** Optionale Override-Beschreibung */
  beschreibung?: string;
};

export function MarketplaceEmpty({ variant = 'marktplatz', headline, beschreibung }: Props) {
  const config = VARIANTS[variant];

  return (
    <Reveal>
      <div className="border border-dashed border-stone rounded-card bg-paper p-10 md:p-14 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-bronze/10 mb-5">
          <config.icon className="w-5 h-5 text-bronze" strokeWidth={1.5} />
        </div>

        <p className="overline mb-3 text-bronze-ink">{config.eyebrow}</p>

        <h3 className="font-serif text-head-lg text-navy font-normal leading-tight mb-3 max-w-xl mx-auto">
          {headline ?? config.headline}
          <span className="text-bronze">.</span>
        </h3>

        <p className="text-body-sm text-muted leading-relaxed mb-7 max-w-md mx-auto">
          {beschreibung ?? config.beschreibung}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button href={config.cta1.href} size="md" className="w-full sm:w-auto">
            {config.cta1.label}
            <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
          </Button>
          {config.cta2 && (
            <Button href={config.cta2.href} size="md" variant="ghost" className="w-full sm:w-auto">
              {config.cta2.label}
            </Button>
          )}
        </div>
      </div>
    </Reveal>
  );
}

/* ──────────────────────────────────────────────────────────────────────
 * Variants
 * ────────────────────────────────────────────────────────────────────── */

const VARIANTS: Record<Variant, {
  icon: LucideIcon;
  eyebrow: string;
  headline: string;
  beschreibung: string;
  cta1: { label: string; href: string };
  cta2?: { label: string; href: string };
}> = {
  marktplatz: {
    icon: FileSearch,
    eyebrow: 'Noch keine Inserate',
    headline: 'Sei der erste KMU-Verkäufer auf passare',
    beschreibung:
      'Aktuell sind noch keine Firmen öffentlich gelistet. Stell dein Unternehmen vor — anonym, mit klarer Bewertung und transparenten Pauschalpreisen.',
    cta1: { label: 'Firma inserieren', href: '/verkaufen' },
    cta2: { label: 'Suchprofil anlegen', href: '/auth/register?role=kaeufer' },
  },
  atlas: {
    icon: FileSearch,
    eyebrow: 'Karte ist noch leer',
    headline: 'Noch keine öffentlichen Inserate auf der Karte',
    beschreibung:
      'Sobald die ersten Verkäufer ihr Inserat freischalten, erscheinen sie hier nach Kanton gruppiert.',
    cta1: { label: 'Firma inserieren', href: '/verkaufen' },
    cta2: { label: 'Marktplatz öffnen', href: '/' },
  },
  'kaeufer-digest': {
    icon: BellRing,
    eyebrow: 'Noch keine Treffer',
    headline: 'Wir suchen für dich — sobald etwas Passendes kommt',
    beschreibung:
      'Leg ein Suchprofil an mit deinen Kriterien. Du bekommst eine Mail, sobald ein neues Inserat zu deinem Profil passt.',
    cta1: { label: 'Suchprofil anlegen', href: '/dashboard/kaeufer/suchprofile/neu' },
    cta2: { label: 'Marktplatz durchsuchen', href: '/' },
  },
  'kaeufer-favoriten': {
    icon: FileSearch,
    eyebrow: 'Keine Favoriten',
    headline: 'Noch keine Inserate auf deiner Liste',
    beschreibung:
      'Klick im Marktplatz auf das Herz, um Inserate hier zu sammeln. Du siehst sie als Kanban-Pipeline — von «Neu» bis «Won».',
    cta1: { label: 'Marktplatz öffnen', href: '/' },
  },
};
