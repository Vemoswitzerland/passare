'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FileText, MessageSquare, FileSignature,
  FolderOpen, BarChart3, Package, Settings, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Counts = {
  anfragenNeu: number;
  ndaPending: number;
  datenraumFiles: number;
};

type Props = {
  inseratId?: string | null;
  inseratStatus?: string | null;
  paket?: string | null;
  counts: Counts;
  onClose?: () => void;
};

export function VerkaeuferSidebar({
  inseratId, inseratStatus, paket, counts, onClose,
}: Props) {
  const path = usePathname();

  const items = [
    { href: '/dashboard/verkaeufer', icon: LayoutDashboard, label: 'Übersicht', exact: true },
    {
      href: '/dashboard/verkaeufer/inserat',
      icon: FileText,
      label: 'Mein Inserat',
      badge: inseratStatus ? statusLabel(inseratStatus) : 'neu',
      badgeVariant: inseratStatus === 'live' ? 'success' as const : inseratStatus === 'zur_pruefung' ? 'warn' as const : 'neutral' as const,
    },
    {
      href: '/dashboard/verkaeufer/anfragen',
      icon: MessageSquare,
      label: 'Anfragen',
      counter: counts.anfragenNeu || undefined,
    },
    {
      href: '/dashboard/verkaeufer/nda',
      icon: FileSignature,
      label: 'NDA',
      counter: counts.ndaPending || undefined,
    },
    {
      href: '/dashboard/verkaeufer/datenraum',
      icon: FolderOpen,
      label: 'Datenraum',
      counter: counts.datenraumFiles || undefined,
    },
    { href: '/dashboard/verkaeufer/statistik', icon: BarChart3, label: 'Statistik' },
    {
      href: '/dashboard/verkaeufer/paket',
      icon: Package,
      label: 'Paket',
      badge: paket ? paket.toUpperCase() : undefined,
      badgeVariant: paket === 'premium' ? 'bronze' as const : paket === 'pro' ? 'navy' as const : 'neutral' as const,
    },
  ];

  const secondary = [
    { href: '/dashboard/verkaeufer/settings', icon: Settings, label: 'Einstellungen' },
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
        <p className="overline text-bronze-ink px-3 mb-3 mt-2">Verkäufer-Bereich</p>
        {items.map((item) => {
          const isActive = item.exact ? path === item.href : path === item.href || path.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-soft text-body-sm transition-all',
                isActive
                  ? 'bg-bronze/10 text-navy font-medium'
                  : 'text-muted hover:bg-stone/40 hover:text-navy',
              )}
            >
              <item.icon className={cn('w-4 h-4 flex-shrink-0', isActive && 'text-bronze-ink')} strokeWidth={1.5} />
              <span className="flex-1">{item.label}</span>
              {item.counter !== undefined && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-pill bg-bronze text-cream text-[10px] font-mono font-medium">
                  {item.counter}
                </span>
              )}
              {item.badge && (
                <span className={cn(
                  'inline-flex items-center px-1.5 py-0.5 rounded-pill text-[10px] font-medium uppercase tracking-wide',
                  item.badgeVariant === 'success' && 'bg-success/15 text-success',
                  item.badgeVariant === 'warn' && 'bg-warn/15 text-warn',
                  item.badgeVariant === 'neutral' && 'bg-stone text-quiet',
                  item.badgeVariant === 'bronze' && 'bg-bronze-soft text-bronze-ink',
                  item.badgeVariant === 'navy' && 'bg-navy-soft text-navy',
                )}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        <div className="border-t border-stone my-4" />

        {secondary.map((item) => {
          const isActive = path === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                onClose?.();
              }}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-soft text-body-sm transition-all',
                isActive
                  ? 'bg-bronze/10 text-navy font-medium'
                  : 'text-muted hover:bg-stone/40 hover:text-navy',
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
              <span className="flex-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-stone bg-paper/50">
        <Link
          href="/verkaufen"
          className="block text-caption text-quiet hover:text-navy transition-colors"
        >
          Über passare →
        </Link>
      </div>
    </aside>
  );
}

function statusLabel(s: string): string {
  switch (s) {
    case 'entwurf': return 'Entwurf';
    case 'zur_pruefung': return 'Prüfung';
    case 'live': return 'Live';
    case 'pausiert': return 'Pausiert';
    case 'verkauft': return 'Verkauft';
    case 'abgelaufen': return 'Abgelaufen';
    case 'abgelehnt': return 'Abgelehnt';
    default: return s;
  }
}
