'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Eye, ShieldCheck, Store, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

type View = 'admin' | 'verkaeufer' | 'kaeufer';

const COOKIE_NAME = 'admin_impersonation';

const OPTIONS: { value: View; label: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; desc: string }[] = [
  { value: 'admin', label: 'Admin-Ansicht', icon: ShieldCheck, desc: 'Alle Verwaltungs-Funktionen' },
  { value: 'verkaeufer', label: 'Als Verkäufer ansehen', icon: Store, desc: 'Plattform aus Verkäufer-Sicht' },
  { value: 'kaeufer', label: 'Als Käufer ansehen', icon: Search, desc: 'Plattform aus Käufer-Sicht' },
];

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=86400; SameSite=Lax`;
}
function clearCookie(name: string) {
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}
function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export function ViewSwitcher() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<View>('admin');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = readCookie(COOKIE_NAME);
    if (stored === 'verkaeufer' || stored === 'kaeufer') {
      setCurrent(stored);
    } else {
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
    if (view === 'admin') {
      clearCookie(COOKIE_NAME);
      try { localStorage.setItem('admin_view', 'admin'); } catch {}
      window.location.href = '/admin';
    } else {
      setCookie(COOKIE_NAME, view);
      try { localStorage.setItem('admin_view', view); } catch {}
      window.location.href = '/dashboard';
    }
  };

  const active = OPTIONS.find((o) => o.value === current) ?? OPTIONS[0];
  const ActiveIcon = active.icon;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-soft border border-stone hover:border-navy/40 bg-paper text-navy text-caption font-medium transition-colors"
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
