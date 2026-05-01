'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Users,
  MessageSquare,
  Activity,
  Settings,
  Newspaper,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  badge?: string | number;
};

type Section = { label: string; items: NavItem[] };

const SECTIONS: Section[] = [
  {
    label: 'Übersicht',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Verwaltung',
    items: [
      { label: 'Inserate', href: '/admin/inserate', icon: FileText },
      { label: 'User', href: '/admin/users', icon: Users },
      { label: 'Nachrichten', href: '/admin/anfragen', icon: MessageSquare },
      // Cyrill 01.05.2026: «Experten-System wie bei app.vemo —
      // Admin pflegt Profile + Honorar, Verkäufer bucht Termine.»
      { label: 'Experten', href: '/admin/experten', icon: Sparkles },
    ],
  },
  {
    label: 'Inhalt',
    items: [
      { label: 'Blog', href: '/admin/blog', icon: Newspaper },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Logs', href: '/admin/logs', icon: Activity },
      { label: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
];

export function AdminSidebar({
  badges,
  onNavigate,
  userFooter,
}: {
  badges?: Partial<Record<string, string | number>>;
  onNavigate?: () => void;
  /** Optionaler Footer-Slot — Account-Card mit Logout am unteren Rand */
  userFooter?: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col h-full">
      <nav className="flex-1 py-4 px-2 overflow-y-auto" aria-label="Admin-Navigation">
        {SECTIONS.map((section) => (
          <div key={section.label} className="mb-4">
            <p className="text-[11px] uppercase tracking-wide text-quiet font-medium px-2.5 py-1">
              {section.label}
            </p>
            <ul className="space-y-0">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                const badge = badges?.[item.href];
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      prefetch={true}
                      onClick={onNavigate}
                      className={cn(
                        'group flex items-center gap-2 px-2.5 py-1.5 rounded-soft text-[13px] transition-colors relative',
                        active
                          ? 'bg-stone/50 text-navy font-medium'
                          : 'text-muted hover:text-navy hover:bg-stone/30',
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-bronze rounded-r" />
                      )}
                      <Icon
                        className={cn('w-4 h-4 flex-shrink-0', active ? 'text-navy' : 'text-quiet group-hover:text-navy')}
                        strokeWidth={1.5}
                      />
                      <span className="flex-1">{item.label}</span>
                      {badge !== undefined && badge !== null && (
                        <span className="font-mono text-[11px] text-quiet bg-cream border border-stone px-1.5 py-px rounded-soft tabular-nums">
                          {badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User-Footer: Avatar + Name + Logout (Slack/Linear-Pattern) */}
      {userFooter}
    </div>
  );
}
