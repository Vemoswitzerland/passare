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
      { label: 'Anfragen', href: '/admin/anfragen', icon: MessageSquare },
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
}: {
  badges?: Partial<Record<string, string | number>>;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <nav className="py-6 px-3 h-full overflow-y-auto" aria-label="Admin-Navigation">
      {SECTIONS.map((section) => (
        <div key={section.label} className="mb-6">
          <p className="overline text-quiet px-3 py-2">{section.label}</p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const badge = badges?.[item.href];
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
                      className={cn('w-[18px] h-[18px] flex-shrink-0', active ? 'text-navy' : 'text-quiet group-hover:text-navy')}
                      strokeWidth={1.5}
                    />
                    <span className="flex-1">{item.label}</span>
                    {badge !== undefined && badge !== null && (
                      <span className="font-mono text-caption text-quiet bg-cream border border-stone px-1.5 py-0.5 rounded-soft">
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

      <div className="mt-8 pt-6 border-t border-stone px-3">
        <p className="text-caption text-quiet leading-relaxed">
          Admin-Bereich V1 — Demo-Daten für Inserate, Anfragen und Logs.
          Echte DB-Anbindung folgt schrittweise.
        </p>
      </div>
    </nav>
  );
}
