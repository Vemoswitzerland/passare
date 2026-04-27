import { cookies } from 'next/headers';
import { CURRENT_STEP, UPDATES, TYPE_LABELS } from '@/data/updates';
import { StatusForm } from './StatusForm';

export const metadata = {
  title: 'Live-Status — passare',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

/**
 * /status — Technischer Verlauf (Build-Log-Style)
 * Mobile-First. Vertikale Timeline mit Hairline.
 */
export default async function StatusPage() {
  const store = await cookies();
  const authed = store.get('passare_status')?.value === '2827';

  if (!authed) return <Gate />;

  return (
    <main className="min-h-screen bg-cream">
      <header className="sticky top-0 z-40 border-b border-stone bg-cream/90 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <a href="/" className="font-serif text-lg text-navy tracking-tight">
            passare<span className="text-bronze">.</span>
          </a>
          <span className="font-mono text-[10px] uppercase tracking-widest text-quiet flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-dot" />
            status · live
          </span>
        </div>
      </header>

      {/* Aktueller Schritt — Build-Log-Style */}
      <section className="px-5 pt-7 md:pt-10 pb-7">
        <div className="max-w-3xl mx-auto">
          <p className="font-mono text-[10px] uppercase tracking-widest text-bronze-ink mb-3">
            $ status --current
          </p>

          <div className="border border-stone rounded-card bg-paper overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-stone bg-cream/40 flex-wrap">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest">
                <span className="text-bronze-ink">{CURRENT_STEP.etappe}</span>
                <span className="text-stone">/</span>
                <span className="text-quiet">branch:</span>
                <span className="text-navy">{CURRENT_STEP.branch}</span>
              </div>
              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-bronze">
                <span className="w-1.5 h-1.5 rounded-full bg-bronze animate-pulse-dot" />
                running
              </span>
            </div>

            {/* Title */}
            <div className="px-4 py-4 border-b border-stone">
              <h2 className="font-serif text-head-md text-navy mb-2 leading-tight">
                {CURRENT_STEP.titel}<span className="text-bronze">.</span>
              </h2>
              <p className="text-body-sm text-muted leading-relaxed">
                {CURRENT_STEP.beschreibung}
              </p>
            </div>

            {/* Task-Liste */}
            <div className="px-4 py-3 bg-cream/30">
              <p className="font-mono text-[10px] uppercase tracking-widest text-quiet mb-2.5">
                tasks · {CURRENT_STEP.tasks.filter(t => t.status === 'done').length}/{CURRENT_STEP.tasks.length}
              </p>
              <ul className="space-y-1">
                {CURRENT_STEP.tasks.map((task, i) => (
                  <li key={i} className="flex items-center gap-3 font-mono text-[11px]">
                    <TaskIcon status={task.status} />
                    <span className={taskTextClass(task.status)}>{task.label}</span>
                    <span className="flex-1 border-b border-dotted border-stone min-w-[10px]" />
                    <span className={`text-[9px] uppercase tracking-widest ${taskStatusClass(task.status)}`}>
                      {task.status === 'done' ? 'ok' : task.status === 'in_progress' ? 'wip' : 'todo'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-stone bg-cream/40 flex items-center justify-between gap-2 flex-wrap">
              <span className="font-mono text-[10px] uppercase tracking-widest text-quiet">
                eta: {CURRENT_STEP.geplant}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-quiet">
                exit_code: pending
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Verlauf — Log-Style */}
      <section className="px-5 pb-16">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <p className="font-mono text-[10px] uppercase tracking-widest text-quiet">
              $ verlauf --tail={UPDATES.length}
            </p>
            <p className="font-mono text-[10px] text-quiet">
              {UPDATES.length} einträge · neueste zuerst
            </p>
          </div>

          {/* Tabellen-Header (nur Desktop) */}
          <div className="hidden md:grid grid-cols-[110px_120px_1fr] gap-4 px-3 py-2 border-y border-stone">
            <span className="font-mono text-[10px] uppercase tracking-widest text-quiet">datum</span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-quiet">typ</span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-quiet">eintrag</span>
          </div>

          {/* Log-Zeilen */}
          <div className="divide-y divide-stone">
            {UPDATES.map((u, i) => (
              <article
                key={i}
                className="md:grid md:grid-cols-[110px_120px_1fr] md:gap-4 px-3 py-3.5 hover:bg-paper/60 transition-colors"
              >
                {/* Mobile: Header-Zeile mit Datum + Typ */}
                <div className="flex items-center gap-3 mb-1.5 md:mb-0 md:contents">
                  <span className="font-mono text-[11px] text-quiet whitespace-nowrap font-tabular md:self-baseline">
                    {formatDate(u.date)}
                  </span>
                  <span className="md:self-baseline">
                    <span className={`inline-block font-mono text-[10px] uppercase tracking-wider ${typeClass(u.type)}`}>
                      {TYPE_LABELS[u.type].toLowerCase()}
                    </span>
                  </span>
                </div>

                {/* Eintrag */}
                <div>
                  <h3 className="text-body-sm md:text-body text-ink font-medium leading-snug mb-1">
                    {u.titel}
                  </h3>
                  <p className="text-caption md:text-body-sm text-muted leading-relaxed">
                    {u.beschreibung}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-stone py-5 px-5">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <p className="font-mono text-[10px] uppercase tracking-widest text-quiet">
            passare · v0.1.8-beta · system_operational
          </p>
          <p className="font-mono text-[10px] text-quiet">
            <a href="mailto:info@passare.ch" className="editorial">info@passare.ch</a>
          </p>
        </div>
      </footer>
    </main>
  );
}

/* ───────────────────────── */

function Gate() {
  return (
    <main className="min-h-screen bg-cream flex flex-col">
      <header className="border-b border-stone">
        <div className="max-w-3xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <a href="/" className="font-serif text-lg text-navy tracking-tight">
            passare<span className="text-bronze">.</span>
          </a>
          <span className="font-mono text-[10px] uppercase tracking-widest text-quiet">
            status · auth required
          </span>
        </div>
      </header>

      <section className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <p className="font-mono text-[10px] uppercase tracking-widest text-bronze-ink mb-3 text-center">
            $ login --intern
          </p>
          <h1 className="font-serif text-display-sm text-navy font-light text-center mb-3">
            Live-Status<span className="text-bronze">.</span>
          </h1>
          <p className="text-body-sm text-muted text-center mb-8 max-w-xs mx-auto leading-relaxed">
            Aktueller Entwicklungsstand &amp; vollständiger Verlauf.
          </p>
          <div className="border border-stone rounded-card p-5 bg-paper">
            <StatusForm />
          </div>
        </div>
      </section>
    </main>
  );
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${y}-${m}-${d}`;
}

function typeClass(type: string): string {
  switch (type) {
    case 'milestone':     return 'text-bronze-ink';
    case 'feature':       return 'text-success';
    case 'design':        return 'text-navy';
    case 'fix':           return 'text-warn';
    case 'content':       return 'text-muted';
    case 'infrastruktur': return 'text-navy';
    default:              return 'text-quiet';
  }
}

function TaskIcon({ status }: { status: 'done' | 'in_progress' | 'pending' }) {
  if (status === 'done') {
    return (
      <span className="flex-shrink-0 w-3.5 h-3.5 rounded-full bg-success/20 flex items-center justify-center text-success text-[10px]">
        ✓
      </span>
    );
  }
  if (status === 'in_progress') {
    return (
      <span className="flex-shrink-0 w-3.5 h-3.5 rounded-full border border-bronze/40 flex items-center justify-center bg-bronze/10">
        <span className="w-1.5 h-1.5 rounded-full bg-bronze animate-pulse-dot" />
      </span>
    );
  }
  return (
    <span className="flex-shrink-0 w-3.5 h-3.5 rounded-full border border-stone" />
  );
}

function taskTextClass(status: 'done' | 'in_progress' | 'pending'): string {
  if (status === 'done') return 'text-muted line-through';
  if (status === 'in_progress') return 'text-navy font-medium';
  return 'text-ink';
}

function taskStatusClass(status: 'done' | 'in_progress' | 'pending'): string {
  if (status === 'done') return 'text-success';
  if (status === 'in_progress') return 'text-bronze';
  return 'text-quiet';
}
