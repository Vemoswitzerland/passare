'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FileText, MessageSquare, Search,
  Users, Package, Settings, X, Heart,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Counts = {
  mandateActive: number;
  anfragenNeu: number;
  suchprofile: number;
  teamMembers: number;
};

type Props = {
  tier?: string | null;
  counts: Counts;
  onClose?: () => void;
};

type Item = {
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  exact?: boolean;
  counter?: number;
  badge?: string;
  badgeVariant?: 'navy' | 'neutral';
};

export function BrokerSidebar({ tier, counts, onClose }: Props) {
  const path = usePathname();

  // Übersicht — immer erste Position
  const overview: Item[] = [
    { href: '/dashboard/broker', icon: LayoutDashboard, label: 'Übersicht', exact: true },
  ];

  // Sektion: Inserieren — alles rund um eigene Mandate
  const inserieren: Item[] = [
    {
      href: '/dashboard/broker/mandate',
      icon: FileText,
      label: 'Mandate',
      counter: counts.mandateActive || undefined,
    },
    {
      href: '/dashboard/broker/anfragen',
      icon: MessageSquare,
      label: 'Anfragen',
      counter: counts.anfragenNeu || undefined,
    },
    ...(tier === 'pro'
      ? [
          {
            href: '/dashboard/broker/team',
            icon: Users,
            label: 'Team',
            counter: counts.teamMembers || undefined,
          } as Item,
        ]
      : []),
  ];

  // Sektion: Suchen — Käufer+-Funktionen für Mandanten
  const suchen: Item[] = [
    {
      href: '/dashboard/broker/suchprofile',
      icon: Search,
      label: 'Suchprofile',
      counter: counts.suchprofile || undefined,
    },
    {
      href: '/dashboard/broker/favoriten',
      icon: Heart,
      label: 'Favoriten',
    },
  ];

  // Konto-Sektion
  const konto: Item[] = [
    {
      href: '/dashboard/broker/paket',
      icon: Package,
      label: 'Paket',
      badge: tier ? tier.toUpperCase() : undefined,
      badgeVariant: tier === 'pro' ? 'navy' : 'neutral',
    },
    { href: '/dashboard/broker/einstellungen', icon: Settings, label: 'Einstellungen' },
  ];

  return (
    <aside className="h-full w-72 bg-cream border-r border-stone flex flex-col">
      <div className="h-16 px-5 border-b border-stone flex items-center justify-between">
        <Link href="/" className="font-serif text-xl text-navy tracking-tight">
          passare<span className="text-bronze">.</span>
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="md:hidden p-1.5 -mr-1 rounded-soft hover:bg-stone/40 transition-colors"
            aria-label="Menü schliessen"
          >
            <X className="w-5 h-5 text-navy" strokeWidth={1.5} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {/* Übersicht */}
        {overview.map((item) => (
          <NavItem key={item.href} item={item} active={isActive(path, item)} onClick={onClose} />
        ))}

        <SectionLabel>Inserieren</SectionLabel>
        {inserieren.map((item) => (
          <NavItem key={item.href} item={item} active={isActive(path, item)} onClick={onClose} />
        ))}

        <SectionLabel>Suchen</SectionLabel>
        {suchen.map((item) => (
          <NavItem key={item.href} item={item} active={isActive(path, item)} onClick={onClose} />
        ))}

        <div className="border-t border-stone my-4" />

        {konto.map((item) => (
          <NavItem key={item.href} item={item} active={isActive(path, item)} onClick={onClose} />
        ))}
      </nav>
    </aside>
  );
}

function isActive(path: string | null | undefined, item: Item): boolean {
  if (!path) return false;
  if (item.exact) return path === item.href;
  return path === item.href || path.startsWith(item.href + '/');
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="overline text-bronze-ink px-3 mb-2 mt-5 first:mt-2">{children}</p>
  );
}

function NavItem({
  item,
  active,
  onClick,
}: {
  item: Item;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-soft text-body-sm transition-all',
        active
          ? 'bg-bronze/10 text-navy font-medium'
          : 'text-muted hover:bg-stone/40 hover:text-navy',
      )}
    >
      <item.icon
        className={cn('w-4 h-4 flex-shrink-0', active && 'text-bronze-ink')}
        strokeWidth={1.5}
      />
      <span className="flex-1">{item.label}</span>
      {item.counter !== undefined && (
        <span className="inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-pill bg-bronze text-cream text-[10px] font-mono font-medium">
          {item.counter}
        </span>
      )}
      {item.badge && (
        <span
          className={cn(
            'inline-flex items-center px-1.5 py-0.5 rounded-pill text-[10px] font-medium uppercase tracking-wide',
            item.badgeVariant === 'navy' && 'bg-navy-soft text-navy',
            item.badgeVariant === 'neutral' && 'bg-stone text-quiet',
          )}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
}
