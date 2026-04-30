'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Heart, MessageSquare, Bell,
  CreditCard, User, type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type SidebarCounts = {
  anfragen?: number;
  favoriten?: number;
  ndas?: number;
  suchprofile?: number;
};

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badgeKey?: keyof SidebarCounts;
  badgeMax?: number;
};

const HAUPTMENU: NavItem[] = [
  { label: 'Übersicht',         href: '/dashboard/kaeufer',              icon: LayoutDashboard },
  { label: 'Nachrichten',       href: '/dashboard/kaeufer/anfragen',     icon: MessageSquare, badgeKey: 'anfragen' },
  { label: 'Favoriten',         href: '/dashboard/kaeufer/favoriten',    icon: Heart, badgeKey: 'favoriten' },
  // «NDAs & Datenraum» entfernt — Cyrill: «NDA werden wir dann und dann nicht abbilden».
  { label: 'Suchprofile',       href: '/dashboard/kaeufer/suchprofile',  icon: Bell, badgeKey: 'suchprofile', badgeMax: 3 },
];

const ACCOUNT: NavItem[] = [
  { label: 'MAX-Abo',           href: '/dashboard/kaeufer/abo',          icon: CreditCard },
  { label: 'Käufer-Profil',     href: '/dashboard/kaeufer/profil',       icon: User },
];

export function SidebarNav({
  counts,
  onNavigate,
}: {
  counts?: SidebarCounts;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard/kaeufer') return pathname === '/dashboard/kaeufer';
    return pathname.startsWith(href);
  };

  return (
    <nav className="py-6 h-full overflow-y-auto" aria-label="Käufer-Navigation">
      {/* ─── Hauptmenü ─── */}
      <div className="px-3 mb-6">
        <p className="overline text-quiet px-3 py-2">Hauptmenü</p>
        <ul className="space-y-0.5">
          {HAUPTMENU.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const badgeRaw = item.badgeKey ? counts?.[item.badgeKey] : undefined;
            const badge = typeof badgeRaw === 'number' ? badgeRaw : undefined;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    'group flex items-center gap-3 px-3 py-2 rounded-soft text-body-sm transition-colors relative',
                    active
                      ? 'bg-stone/50 text-navy font-medium'
                      : 'text-muted hover:text-navy hover:bg-stone/30',
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-bronze rounded-r" />
                  )}
                  <Icon
                    className={cn('w-[18px] h-[18px] flex-shrink-0',
                      active ? 'text-navy' : 'text-quiet group-hover:text-navy')}
                    strokeWidth={1.5}
                  />
                  <span className="flex-1">{item.label}</span>
                  {badge !== undefined && badge > 0 && (
                    <span className="font-mono text-caption text-quiet bg-cream border border-stone px-1.5 py-0.5 rounded-soft">
                      {item.badgeMax ? `${badge}/${item.badgeMax}` : badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ─── Account ─── */}
      <div className="px-3 mb-6">
        <p className="overline text-quiet px-3 py-2">Account</p>
        <ul className="space-y-0.5">
          {ACCOUNT.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    'group flex items-center gap-3 px-3 py-2 rounded-soft text-body-sm transition-colors relative',
                    active
                      ? 'bg-stone/50 text-navy font-medium'
                      : 'text-muted hover:text-navy hover:bg-stone/30',
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-bronze rounded-r" />
                  )}
                  <Icon
                    className={cn('w-[18px] h-[18px] flex-shrink-0',
                      active ? 'text-navy' : 'text-quiet group-hover:text-navy')}
                    strokeWidth={1.5}
                  />
                  <span className="flex-1">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Cyrill 30.04.2026: «Live-Badge wegnehmen — Verkäufer/Käufer
          sieht ja eh dass er im Bereich ist». Footer ohne Sync-Dot. */}
      <div className="mt-8 pt-6 border-t border-stone px-6">
        <p className="text-caption text-quiet leading-relaxed">
          Daily Digest jeden Morgen 7:00 Uhr.
        </p>
      </div>
    </nav>
  );
}
