import { cookies } from 'next/headers';
import { CURRENT_STEP, UPDATES, TYPE_LABELS, TYPE_COLORS } from '@/data/updates';
import { StatusForm } from './StatusForm';

export const metadata = {
  title: 'Live-Status — passare',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

/**
 * /status — Live-Entwicklungsseite (intern, Code-geschützt 2827).
 * Mobile-First. Reverse-Chronologisch.
 */
export default async function StatusPage() {
  const store = await cookies();
  const authed = store.get('passare_status')?.value === '2827';

  if (!authed) {
    return <Gate />;
  }

  return (
    <main className="min-h-screen bg-cream">
      {/* Top-Bar mobile-first */}
      <header className="sticky top-0 z-40 border-b border-stone bg-cream/90 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
          <a href="/" className="font-serif text-xl text-navy tracking-tight">
            passare<span className="text-bronze">.</span>
          </a>
          <span className="font-mono text-[10px] uppercase tracking-widest text-quiet border border-stone rounded-full px-2 py-0.5">
            Live-Status
          </span>
        </div>
      </header>

      {/* Aktueller Schritt — prominent */}
      <section className="px-5 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          <p className="overline mb-3 text-bronze-ink">Aktueller Schritt</p>
          <h1 className="font-serif text-display-sm text-navy font-light leading-tight mb-5">
            {CURRENT_STEP.etappe}<span className="text-bronze">:</span>
            <br />
            <span className="italic">{CURRENT_STEP.titel}<span className="not-italic text-bronze">.</span></span>
          </h1>
          <div className="bg-paper border border-stone rounded-card p-5 md:p-6">
            <p className="text-body text-muted leading-relaxed mb-4">
              {CURRENT_STEP.beschreibung}
            </p>
            <p className="font-mono text-[11px] uppercase tracking-widest text-quiet flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-bronze animate-pulse-dot" />
              In Arbeit · {CURRENT_STEP.geplant}
            </p>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="px-5 pb-16">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <p className="overline text-navy">Was bereits erledigt ist</p>
            <span className="h-px flex-1 bg-stone" />
            <span className="font-mono text-[11px] text-quiet">
              {UPDATES.length} Updates
            </span>
          </div>

          <div className="space-y-3">
            {UPDATES.map((u, i) => (
              <article
                key={i}
                className="bg-paper border border-stone rounded-card p-4 md:p-5"
              >
                <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                  <span
                    className={`font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border ${TYPE_COLORS[u.type]}`}
                  >
                    {TYPE_LABELS[u.type]}
                  </span>
                  <span className="font-mono text-[10px] text-quiet">
                    {formatDate(u.date)}
                  </span>
                </div>
                <h2 className="font-serif text-head-sm md:text-head-md text-navy font-normal leading-snug mb-2">
                  {u.titel}
                </h2>
                <p className="text-body-sm text-muted leading-relaxed">
                  {u.beschreibung}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone py-6 px-5">
        <div className="max-w-2xl mx-auto flex flex-col gap-2 text-caption text-quiet">
          <p className="font-mono text-[10px] uppercase tracking-widest">
            passare &middot; live-entwicklungsstatus &middot; intern
          </p>
          <p className="text-[11px] text-quiet">
            Diese Seite wird nach jedem Deploy aktualisiert. Bei Fragen: <a href="mailto:info@passare.ch" className="editorial">info@passare.ch</a>.
          </p>
        </div>
      </footer>
    </main>
  );
}

/* ───────────────────────────────────────── */

function Gate() {
  return (
    <main className="min-h-screen bg-cream flex flex-col">
      <header className="border-b border-stone">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
          <a href="/" className="font-serif text-xl text-navy tracking-tight">
            passare<span className="text-bronze">.</span>
          </a>
          <span className="font-mono text-[10px] uppercase tracking-widest text-quiet">
            Live-Status
          </span>
        </div>
      </header>

      <section className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <p className="overline mb-4 text-bronze-ink">Intern</p>
            <h1 className="font-serif text-display-sm text-navy font-light mb-3">
              Live-Status
            </h1>
            <p className="text-body text-muted leading-relaxed">
              Zeigt den aktuellen Entwicklungsstand und alle Updates.
            </p>
          </div>

          <div className="bg-paper border border-stone rounded-card p-6">
            <StatusForm />
          </div>
        </div>
      </section>
    </main>
  );
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y.slice(2)}`;
}
