'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, User, ShieldCheck } from 'lucide-react';
import { setAnonymitaetLevel } from '../actions';
import { cn } from '@/lib/utils';

/**
 * 3-Stufen-Toggle für Anonymitäts-Level direkt aus «Mein Inserat».
 *
 * Cyrill 30.04.2026: «Man soll irgendwo umstellen können, ob das
 * Profil auf anonym, mittel-anonym oder voll-offen ist. Direkt unter
 * Übersicht, ohne Wizard».
 *
 * Anonymitäts-Level ist KEIN sicherheitsrelevantes Feld → bleibt live,
 * kein Re-Review. Verkäufer entscheidet jederzeit selbst.
 *
 * Werte (DB-Enum public.anonymitaet_level):
 *   - voll_anonym       → Branche/Eckdaten, keine Person/Firma
 *   - vorname_funktion  → + Vorname & Funktion (Halb-anonym)
 *   - voll_offen        → + Nachname, Foto, Mail, WhatsApp, Firmen-Identität
 */

type Level = 'voll_anonym' | 'vorname_funktion' | 'voll_offen';

const OPTIONS: Array<{
  value: Level;
  label: string;
  sub: string;
  icon: typeof EyeOff;
}> = [
  {
    value: 'voll_anonym',
    label: 'Anonym',
    sub: 'Nur Branche, Kanton, Eckdaten',
    icon: EyeOff,
  },
  {
    value: 'vorname_funktion',
    label: 'Halb-anonym',
    sub: 'Plus Vorname & Funktion',
    icon: User,
  },
  {
    value: 'voll_offen',
    label: 'Voll-offen',
    sub: 'Plus Foto, Mail, Firma',
    icon: Eye,
  },
];

export function AnonymitaetToggle({
  inseratId,
  current,
}: {
  inseratId: string;
  current: Level;
}) {
  const router = useRouter();
  const [active, setActive] = useState<Level>(current);
  const [pending, startTx] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const select = (level: Level) => {
    if (level === active || pending) return;
    const previous = active;
    setActive(level); // optimistic
    setFeedback(null);

    startTx(async () => {
      const res = await setAnonymitaetLevel(inseratId, level);
      if (res.ok) {
        setFeedback('Übernommen — Inserat bleibt live.');
        router.refresh();
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setActive(previous); // rollback
        setFeedback(`Fehler: ${res.error}`);
      }
    });
  };

  return (
    <section className="mb-6 rounded-card bg-paper border border-stone p-5 md:p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-full bg-bronze/10 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-4 h-4 text-bronze-ink" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-serif text-head-sm text-navy font-light mb-0.5">
            Anonymität
          </h2>
          <p className="text-caption text-muted">
            Wieviel Käufer sehen sollen — kannst du jederzeit umstellen, Inserat bleibt live.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-2">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isActive = active === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => select(opt.value)}
              disabled={pending}
              className={cn(
                'text-left rounded-soft border p-3 transition-all',
                isActive
                  ? 'border-bronze bg-bronze/5 shadow-subtle'
                  : 'border-stone hover:border-navy/30 hover:bg-stone/30',
                pending && 'opacity-60 cursor-wait',
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon
                  className={cn('w-4 h-4', isActive ? 'text-bronze-ink' : 'text-quiet')}
                  strokeWidth={1.5}
                />
                <p
                  className={cn(
                    'text-body-sm font-medium',
                    isActive ? 'text-navy' : 'text-ink',
                  )}
                >
                  {opt.label}
                </p>
                {isActive && (
                  <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded-pill bg-bronze text-cream text-[10px] uppercase tracking-wider font-medium">
                    aktiv
                  </span>
                )}
              </div>
              <p className="text-caption text-quiet leading-snug">{opt.sub}</p>
            </button>
          );
        })}
      </div>

      {feedback && (
        <p className={cn(
          'text-caption mt-3',
          feedback.startsWith('Fehler') ? 'text-danger' : 'text-success',
        )}>
          {feedback}
        </p>
      )}
    </section>
  );
}
