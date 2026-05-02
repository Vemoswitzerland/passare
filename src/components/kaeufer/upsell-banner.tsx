import Link from 'next/link';
import { Crown, ArrowRight } from 'lucide-react';

type Props = {
  variant?: 'card' | 'banner' | 'inline';
  reason?: string;
};

export function MaxUpsellBanner({ variant = 'card', reason }: Props) {
  if (variant === 'inline') {
    return (
      <Link
        href="/dashboard/kaeufer/abo"
        className="inline-flex items-center gap-2 text-caption text-bronze-ink hover:text-bronze underline decoration-dotted underline-offset-2"
      >
        <Crown className="w-3.5 h-3.5" strokeWidth={1.5} />
        Mit Käufer+ freischalten
        <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
      </Link>
    );
  }

  if (variant === 'banner') {
    return (
      <div className="bg-bronze/5 border border-bronze/20 rounded-card px-5 py-4 flex items-center gap-4 flex-wrap">
        <Crown className="w-5 h-5 text-bronze flex-shrink-0" strokeWidth={1.5} />
        <p className="text-body-sm text-muted flex-1 min-w-[240px]">
          <span className="text-navy font-medium">{reason ?? '7 Tage Frühzugang.'}</span>{' '}
          Käufer+-Mitglieder sehen neue Inserate eine Woche vor allen anderen.
        </p>
        <Link
          href="/dashboard/kaeufer/abo"
          className="font-mono text-[11px] uppercase tracking-widest text-navy hover:text-bronze inline-flex items-center gap-1"
        >
          Auf Käufer+ wechseln <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
        </Link>
      </div>
    );
  }

  // Card-Variante
  return (
    <div className="bg-navy text-cream rounded-card p-6 md:p-7">
      <div className="flex items-center gap-2 mb-3">
        <Crown className="w-4 h-4 text-bronze" strokeWidth={1.5} />
        <p className="overline text-bronze">Käufer+</p>
      </div>
      <h3 className="font-serif text-head-md text-cream font-normal mb-3 leading-snug">
        7 Tage Frühzugang. Echtzeit-Alerts. Eigenes Logo<span className="text-bronze">.</span>
      </h3>
      <p className="text-body-sm text-cream/80 leading-relaxed mb-5 max-w-md">
        {reason ?? 'Mit Käufer+ siehst du neue Inserate eine Woche bevor sie öffentlich werden — und bekommst Echtzeit-E-Mail-Alerts bei jedem Match.'}
      </p>
      <div className="flex items-center gap-4 flex-wrap">
        <Link
          href="/dashboard/kaeufer/abo"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-bronze text-cream rounded-soft text-body-sm font-medium hover:bg-bronze-ink transition-colors"
        >
          Mit Käufer+ starten
          <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
        </Link>
        <Link
          href="/plus"
          className="font-mono text-caption uppercase tracking-widest text-cream/70 hover:text-bronze"
        >
          Vorteile ansehen
        </Link>
      </div>
    </div>
  );
}
