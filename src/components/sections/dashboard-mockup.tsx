'use client';

import { motion } from 'framer-motion';
import {
  LayoutDashboard, FileText, MessageSquare, Archive, BarChart3,
  Sparkles, Package, Eye, Heart, TrendingUp,
} from 'lucide-react';

/**
 * Dashboard-Mockup für passare — Browser-Chrome-Style.
 * Simuliert `app.passare.ch` Verkäufer-Dashboard.
 *
 * Cyrill 02.05.2026: «Mockup ist veraltet — NDA und Mandate raus,
 * an den aktuellen Stand anpassen». Aktuelle Sidebar: Übersicht ·
 * Mein Inserat · Nachrichten · Datenraum · Statistik · Experten · Paket.
 * KPIs: Views · Nachrichten · Favoriten. «0 % Erfolgsprovision» als
 * USP-Banner unten — passt zur Self-Service-Plattform-Positionierung.
 */
export function DashboardMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full"
    >
      <div className="bg-navy rounded-card overflow-hidden shadow-lift">
        {/* Titlebar */}
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-navy">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
          </div>
          <div className="flex-1 mx-2">
            <div className="mx-auto max-w-xs bg-ink/50 rounded-full px-3 py-0.5 text-center">
              <span className="font-mono text-[10px] text-cream/60 tracking-wide">
                app.passare.ch
              </span>
            </div>
          </div>
        </div>

        {/* App-Content */}
        <div className="bg-cream flex">
          <aside className="hidden md:block w-40 bg-paper border-r border-stone p-3.5">
            <p className="font-serif text-lg text-navy mb-5">
              passare<span className="text-bronze">.</span>
            </p>
            <nav className="space-y-0.5">
              <NavItem Icon={LayoutDashboard} label="Übersicht" active />
              <NavItem Icon={FileText} label="Mein Inserat" badge="Live" tone="success" />
              <NavItem Icon={MessageSquare} label="Nachrichten" badge="3" />
              <NavItem Icon={Archive} label="Datenraum" />
              <NavItem Icon={BarChart3} label="Statistik" />
              <NavItem Icon={Sparkles} label="Experten" />
              <NavItem Icon={Package} label="Paket" badge="PRO" tone="bronze" />
            </nav>
          </aside>

          <div className="flex-1 p-4 md:p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-quiet mb-1">
                  Übersicht
                </p>
                <h3 className="font-serif text-lg md:text-xl text-navy font-light leading-tight">
                  Guten Morgen<span className="text-bronze">.</span>
                </h3>
              </div>
              <span className="hidden md:inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-success bg-success/5 border border-success/20 px-2 py-0.5 rounded-full">
                <span className="w-1 h-1 rounded-full bg-success animate-pulse-dot" />
                inserat live
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <KpiTile label="Views" value="247" delta="+18" Icon={Eye} />
              <KpiTile label="Nachrichten" value="12" delta="+4" Icon={MessageSquare} highlight />
              <KpiTile label="Favoriten" value="34" delta="+6" Icon={Heart} />
            </div>

            <div className="bg-paper border border-stone rounded-soft overflow-hidden mb-3">
              <div className="flex items-center justify-between px-3.5 py-2 border-b border-stone">
                <p className="font-mono text-[9px] uppercase tracking-widest text-quiet">
                  Mein Inserat
                </p>
                <span className="font-mono text-[9px] text-bronze">● Live</span>
              </div>
              <InseratRow title="Spezialmaschinen ZH" meta="Maschinenbau · ZH" kpi="CHF 8.4M" status="Live" />
              <InseratRow title="EBITDA-Marge" meta="Letzter Abschluss" kpi="18.2 %" status="" muted />
              <InseratRow title="Mitarbeitende" meta="Vollzeit-Äquivalente" kpi="34" status="" muted last />
            </div>

            {/* USP-Streifen — passend zur 0%-Provisions-Positionierung */}
            <div className="hidden md:flex items-center justify-between px-3.5 py-2 rounded-soft bg-bronze/5 border border-bronze/30">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] uppercase tracking-widest text-bronze-ink">
                  0 % Provision
                </span>
                <span className="font-mono text-[9px] text-quiet">
                  · einmalige Inserat-Gebühr · ohne Erfolgsanteil
                </span>
              </div>
              <span className="font-mono text-[9px] text-quiet">passare.ch</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────── */

function NavItem({
  Icon,
  label,
  active,
  badge,
  tone = 'neutral',
}: {
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  active?: boolean;
  badge?: string;
  tone?: 'neutral' | 'success' | 'bronze';
}) {
  const badgeCls = active
    ? 'bg-cream/15 text-cream'
    : tone === 'success'
      ? 'bg-success/15 text-success'
      : tone === 'bronze'
        ? 'bg-bronze/20 text-bronze-ink'
        : 'bg-stone text-muted';
  return (
    <div
      className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-soft text-[11px] ${
        active ? 'bg-navy text-cream font-medium' : 'text-muted font-normal'
      }`}
    >
      <span className="flex items-center gap-2">
        <Icon className="w-3 h-3" strokeWidth={1.5} />
        {label}
      </span>
      {badge && (
        <span className={`font-mono text-[9px] px-1 py-0 rounded-full ${badgeCls}`}>
          {badge}
        </span>
      )}
    </div>
  );
}

function KpiTile({
  label,
  value,
  delta,
  Icon,
  highlight,
}: {
  label: string;
  value: string;
  delta: string;
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  highlight?: boolean;
}) {
  return (
    <div
      className={`p-2.5 rounded-soft border ${
        highlight ? 'bg-navy text-cream border-navy' : 'bg-paper text-ink border-stone'
      }`}
    >
      <div className="flex items-start justify-between mb-1.5">
        <p className={`font-mono text-[9px] uppercase tracking-widest ${highlight ? 'text-cream/60' : 'text-quiet'}`}>
          {label}
        </p>
        <Icon className="w-3 h-3 text-bronze" strokeWidth={1.5} />
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="font-serif text-xl font-light font-tabular leading-none">
          {value}
        </span>
        <span className={`font-mono text-[9px] ${highlight ? 'text-bronze' : 'text-success'}`}>
          <TrendingUp className="inline w-2 h-2 mr-0.5" strokeWidth={2} />
          {delta}
        </span>
      </div>
    </div>
  );
}

function InseratRow({
  title,
  meta,
  kpi,
  status,
  last,
  muted,
}: {
  title: string;
  meta: string;
  kpi: string;
  status: string;
  last?: boolean;
  muted?: boolean;
}) {
  const statusColor =
    status === 'Live' ? 'bg-success/10 text-success'
    : status === 'Prüfung' ? 'bg-stone/50 text-muted'
    : '';

  return (
    <div className={`flex items-center gap-2.5 px-3.5 py-2.5 ${!last && 'border-b border-stone'}`}>
      <div className="flex-1 min-w-0">
        <p className={`font-serif text-[12px] leading-tight truncate ${muted ? 'text-muted' : 'text-navy'}`}>
          {title}
        </p>
        <p className="font-mono text-[9px] uppercase tracking-widest text-quiet">{meta}</p>
      </div>
      <p className={`font-mono text-[11px] font-tabular font-medium whitespace-nowrap ${muted ? 'text-quiet' : 'text-navy'}`}>
        {kpi}
      </p>
      {status && (
        <span className={`font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-full ${statusColor}`}>
          {status}
        </span>
      )}
    </div>
  );
}
