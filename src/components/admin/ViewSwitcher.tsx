'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { ChevronDown, Eye, ShieldCheck, Store, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { enterImpersonationAction, exitImpersonationAction } from '@/app/admin/actions';

type View = 'admin' | 'verkaeufer' | 'kaeufer';

const OPTIONS: { value: View; label: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; desc: string }[] = [
  { value: 'admin', label: 'Admin-Ansicht', icon: ShieldCheck, desc: 'Alle Verwaltungs-Funktionen' },
  { value: 'verkaeufer', label: 'Als Verkäufer ansehen', icon: Store, desc: 'Plattform aus Verkäufer-Sicht' },
  { value: 'kaeufer', label: 'Als Käufer ansehen', icon: Search, desc: 'Plattform aus Käufer-Sicht' },
];

export function ViewSwitcher() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<View>('admin');
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Cookie ist httpOnly → wir lesen den View-State aus localStorage
    // (nur als UI-Hint; die echte Quelle ist das httpOnly-Cookie auf dem Server).
    try {
      const stored = localStorage.getItem('admin_view');
      if (stored === 'verkaeufer' || stored === 'kaeufer') {
        setCurrent(stored);
      } else {
        setCurrent('admin');
      }
    } catch {
      setCurrent('admin');
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const select = (view: View) => {
    setOpen(false);
    startTransition(async () => {
      if (view === 'admin') {
        await exitImpersonationAction();
        try { localStorage.setItem('admin_view', 'admin'); } catch {}
        window.location.href = '/admin';
      } else {
        await enterImpersonationAction(view);
        try { localStorage.setItem('admin_view', view); } catch {}
        window.location.href = '/dashboard';
      }
    });
  };

  const active = OPTIONS.find((o) => o.value === current) ?? OPTIONS[0];
  const ActiveIcon = active.icon;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={pending}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-soft border border-stone hover:border-navy/40 bg-paper text-navy text-caption font-medium transition-colors disabled:opacity-50"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <ActiveIcon className="w-4 h-4" strokeWidth={1.5} />
        <span className="hidden sm:inline">{active.label}</span>
        <span className="inline sm:hidden">Ansicht</span>
        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} strokeWidth={1.5} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-72 bg-paper border border-stone rounded-card shadow-lift py-2 z-50 animate-fade-in"
        >
          <p className="px-4 py-2 overline text-quiet">Ansicht wechseln</p>
          {OPTIONS.map((opt) => {
            const OptIcon = opt.icon;
            const isActive = opt.value === current;
            return (
              <button
                key={opt.value}
                role="menuitem"
                type="button"
                onClick={() => select(opt.value)}
                className={cn(
                  'w-full text-left px-4 py-2.5 flex items-start gap-3 transition-colors',
                  isActive ? 'bg-stone/40' : 'hover:bg-stone/30',
                )}
              >
                <div className={cn(
                  'w-8 h-8 rounded-soft flex items-center justify-center flex-shrink-0 mt-0.5',
                  isActive ? 'bg-bronze/20' : 'bg-stone/50',
                )}>
                  <OptIcon className={cn('w-4 h-4', isActive ? 'text-bronze-ink' : 'text-navy')} strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-body-sm', isActive ? 'text-navy font-medium' : 'text-ink')}>
                    {opt.label}
                  </p>
                  <p className="text-caption text-quiet mt-0.5">{opt.desc}</p>
                </div>
                {isActive && <Eye className="w-3.5 h-3.5 text-bronze flex-shrink-0 mt-1.5" strokeWidth={1.5} />}
              </button>
            );
          })}
          <div className="border-t border-stone mt-2 pt-2 px-4">
            <p className="text-caption text-quiet">
              Demo-Modus — echte Impersonation folgt in Etappe 90+.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
