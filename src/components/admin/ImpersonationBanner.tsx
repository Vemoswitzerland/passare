'use client';

import { useEffect, useState } from 'react';
import { Eye, X } from 'lucide-react';

const COOKIE_NAME = 'admin_impersonation';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

const ROLLE_LABEL: Record<string, string> = {
  verkaeufer: 'Verkäufer',
  kaeufer: 'Käufer',
};

export function ImpersonationBanner() {
  const [rolle, setRolle] = useState<string | null>(null);

  useEffect(() => {
    setRolle(readCookie(COOKIE_NAME));
  }, []);

  if (!rolle) return null;

  const exit = () => {
    clearCookie(COOKIE_NAME);
    try {
      localStorage.setItem('admin_view', 'admin');
    } catch {}
    window.location.href = '/admin';
  };

  return (
    <div className="bg-bronze/15 border-b border-bronze/40 px-6 py-3 flex items-center justify-between gap-4 sticky top-16 z-30">
      <p className="text-body-sm text-navy flex items-center gap-2">
        <Eye className="w-4 h-4" strokeWidth={1.5} />
        Du betrachtest die Plattform als&nbsp;
        <strong>{ROLLE_LABEL[rolle] ?? rolle}</strong> — Demo-Modus.
      </p>
      <button
        type="button"
        onClick={exit}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-soft border border-bronze/40 bg-paper text-navy text-caption font-medium hover:bg-bronze/10 transition-colors"
      >
        <X className="w-3.5 h-3.5" strokeWidth={1.5} />
        Zurück zur Admin-Ansicht
      </button>
    </div>
  );
}
