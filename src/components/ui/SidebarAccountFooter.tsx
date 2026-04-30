'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { LogOut, ChevronUp, User as UserIcon, Crown } from 'lucide-react';
import { logoutAction } from '@/app/auth/actions';
import { cn } from '@/lib/utils';

type Props = {
  email: string;
  fullName: string | null;
  /** Wo geht «Mein Konto» / «Profil» hin? Pro Bereich anders. */
  profileHref: string;
  profileLabel?: string;
  /** Optionaler zweiter Eintrag (z. B. «MAX-Abo» für Käufer). */
  secondary?: { href: string; label: string; icon?: 'crown' | 'user' };
};

/**
 * Generischer Account-Footer für Sidebar-unten.
 * Pattern wie Slack/Linear/Notion/Admin: Avatar + Name unten links,
 * Click öffnet nach oben das Menü mit Profil-Link + Logout.
 *
 * Cyrill: «Profil bei jedem Dashboard nicht oben — sondern unten».
 */
export function SidebarAccountFooter({
  email,
  fullName,
  profileHref,
  profileLabel = 'Mein Konto',
  secondary,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const initials =
    fullName
      ?.split(' ')
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || email.slice(0, 2).toUpperCase();

  const SecondaryIcon = secondary?.icon === 'crown' ? Crown : UserIcon;

  return (
    <div ref={ref} className="relative border-t border-stone bg-paper p-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full flex items-center gap-2.5 px-2 py-2 rounded-soft transition-colors',
          open ? 'bg-stone/40' : 'hover:bg-stone/30',
        )}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="w-7 h-7 rounded-full bg-navy text-cream flex items-center justify-center text-[11px] font-mono font-medium flex-shrink-0">
          {initials}
        </span>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[12px] text-navy font-medium leading-tight truncate">
            {fullName ?? email.split('@')[0]}
          </p>
          <p className="text-[10px] text-quiet font-mono leading-tight truncate">{email}</p>
        </div>
        <ChevronUp
          className={cn('w-3.5 h-3.5 text-quiet transition-transform flex-shrink-0', open && 'rotate-180')}
          strokeWidth={1.5}
        />
      </button>

      {open && (
        <div className="absolute left-2 right-2 bottom-full mb-2 bg-paper border border-stone rounded-card shadow-lift py-2 z-50 animate-fade-in">
          <div className="px-3 py-2 border-b border-stone">
            {fullName && <p className="text-[12px] text-navy font-medium truncate">{fullName}</p>}
            <p className="text-[11px] text-quiet font-mono truncate">{email}</p>
          </div>
          <div className="py-1">
            <Link
              href={profileHref}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-1.5 text-[13px] text-ink hover:bg-stone/30 transition-colors"
            >
              <UserIcon className="w-3.5 h-3.5 text-quiet" strokeWidth={1.5} />
              {profileLabel}
            </Link>
            {secondary && (
              <Link
                href={secondary.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-1.5 text-[13px] text-ink hover:bg-stone/30 transition-colors"
              >
                <SecondaryIcon className="w-3.5 h-3.5 text-quiet" strokeWidth={1.5} />
                {secondary.label}
              </Link>
            )}
            <form action={logoutAction}>
              <button
                type="submit"
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[13px] text-ink hover:bg-stone/30 transition-colors text-left"
              >
                <LogOut className="w-3.5 h-3.5 text-quiet" strokeWidth={1.5} />
                Abmelden
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
