'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';

type Props = {
  firstName: string;
  target: string;
  paid: boolean;
};

const STAGES = [
  { delay: 0,    label: 'Profil bestätigt' },
  { delay: 700,  label: 'Inserat verbunden' },
  { delay: 1400, label: 'Dashboard wird geladen' },
];

export function WelcomeAnimation({ firstName, target, paid }: Props) {
  const router = useRouter();
  const [stage, setStage] = useState(-1);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    STAGES.forEach((s, i) => {
      timers.push(setTimeout(() => setStage(i), s.delay));
    });
    timers.push(setTimeout(() => {
      router.replace(target);
    }, 2600));
    return () => timers.forEach((t) => clearTimeout(t));
  }, [router, target]);

  return (
    <div className="fixed inset-0 bg-cream flex flex-col items-center justify-center z-50 overflow-hidden">
      {/* Hintergrund-Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vmin] h-[80vmin] rounded-full bg-bronze/10 blur-[120px] animate-welcome-glow" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vmin] h-[40vmin] rounded-full bg-navy/5 blur-[80px] animate-welcome-glow-slow" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        {/* Logo zentral mit Reveal-Animation */}
        <div className="mb-8 animate-welcome-logo-in">
          <p className="font-serif text-display-lg text-navy font-light tracking-tight">
            passare<span className="text-bronze">.</span>
          </p>
        </div>

        {/* Greeting */}
        <div className="mb-10 animate-welcome-text-in" style={{ animationDelay: '300ms' }}>
          {paid ? (
            <>
              <p className="overline text-bronze-ink mb-3">Bezahlung erfolgreich</p>
              <h1 className="font-serif text-display-md text-navy font-light tracking-tight">
                {firstName ? `Danke, ${firstName}.` : 'Danke.'}
              </h1>
              <p className="text-body-lg text-muted mt-3 max-w-md mx-auto leading-relaxed">
                Dein Inserat geht jetzt zur Prüfung. Wir melden uns innerhalb von 24 Stunden.
              </p>
            </>
          ) : (
            <>
              <p className="overline text-bronze-ink mb-3">Konto bereit</p>
              <h1 className="font-serif text-display-md text-navy font-light tracking-tight">
                {firstName ? `Willkommen, ${firstName}.` : 'Willkommen.'}
              </h1>
              <p className="text-body-lg text-muted mt-3 max-w-md mx-auto leading-relaxed">
                Wir richten dein Verkäufer-Dashboard ein.
              </p>
            </>
          )}
        </div>

        {/* Progress-Stages */}
        <div className="space-y-3 min-w-[280px]">
          {STAGES.map((s, i) => {
            const active = stage >= i;
            return (
              <div
                key={s.label}
                className={`flex items-center gap-3 transition-all duration-500 ${
                  active ? 'opacity-100 translate-y-0' : 'opacity-30 translate-y-1'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                    active ? 'bg-bronze' : 'border-2 border-stone'
                  }`}
                >
                  {active && <Check className="w-3 h-3 text-cream" strokeWidth={3} />}
                </div>
                <span className={`text-body-sm transition-colors ${active ? 'text-navy' : 'text-quiet'}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <p className="absolute bottom-8 text-caption text-quiet font-mono uppercase tracking-widest">
        passare &middot; Made in Switzerland
      </p>
    </div>
  );
}
