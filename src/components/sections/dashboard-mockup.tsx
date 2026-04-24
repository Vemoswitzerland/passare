'use client';

import { motion } from 'framer-motion';
import { LayoutDashboard, FileText, Users, FileLock2, Archive, BarChart3, ShieldCheck, TrendingUp, Eye } from 'lucide-react';

/**
 * Dashboard-Mockup für passare — Browser-Chrome-Style.
 * Simuliert `app.passare.ch` Verkäufer-Dashboard.
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

        {/* App-Content — kompakter */}
        <div className="bg-cream flex">
          <aside className="hidden md:block w-40 bg-paper border-r border-stone p-3.5">
            <p className="font-serif text-lg text-navy mb-5">
              passare<span className="text-bronze">.</span>
            </p>
            <nav className="space-y-0.5">
              <NavItem Icon={LayoutDashboard} label="Dashboard" active />
              <NavItem Icon={FileText} label="Mandate" badge="3" />
              <NavItem Icon={Users} label="Anfragen" badge="12" />
              <NavItem Icon={FileLock2} label="NDA" />
              <NavItem Icon={Archive} label="Datenraum" />
              <NavItem Icon={BarChart3} label="Statistik" />
            </nav>
          </aside>

          <div className="flex-1 p-4 md:p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-quiet mb-1">
                  Dashboard
                </p>
                <h3 className="font-serif text-lg md:text-xl text-navy font-light leading-tight">
                  Guten Morgen<span className="text-bronze">.</span>
                </h3>
              </div>
              <span className="hidden md:inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-success bg-success/5 border border-success/20 px-2 py-0.5 rounded-full">
                <span className="w-1 h-1 rounded-full bg-success animate-pulse-dot" />
                online
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <KpiTile label="Views" value="247" delta="+18" Icon={Eye} />
              <KpiTile label="Anfragen" value="12" delta="+4" Icon={Users} />
              <KpiTile label="NDA" value="5" delta="+2" Icon={ShieldCheck} highlight />
            </div>

            <div className="bg-paper border border-stone rounded-soft overflow-hidden">
              <div className="flex items-center justify-between px-3.5 py-2 border-b border-stone">
                <p className="font-mono text-[9px] uppercase tracking-widest text-quiet">
                  Meine Mandate · 3
                </p>
                <span className="font-mono text-[9px] text-bronze">● Live</span>
              </div>
              <MandatRow title="Spezialmaschinen ZH" meta="Maschinenbau" kpi="CHF 8.4M" status="Live" />
              <MandatRow title="Bäckerei mit Filialen" meta="Lebensmittel" kpi="18.2%" status="NDA" />
              <MandatRow title="IT-Dienstleister ZG" meta="Technologie" kpi="34 MA" status="Prüfung" last />
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
}: {
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  active?: boolean;
  badge?: string;
}) {
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
        <span
          className={`font-mono text-[9px] px-1 py-0 rounded-full ${
            active ? 'bg-cream/15 text-cream' : 'bg-bronze/15 text-bronze-ink'
          }`}
        >
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

function MandatRow({
  title,
  meta,
  kpi,
  status,
  last,
}: {
  title: string;
  meta: string;
  kpi: string;
  kpiLabel?: string;
  status: string;
  last?: boolean;
}) {
  const statusColor =
    status === 'Live' ? 'bg-success/10 text-success'
    : status === 'NDA' ? 'bg-bronze/15 text-bronze-ink'
    : 'bg-stone/50 text-muted';

  return (
    <div className={`flex items-center gap-2.5 px-3.5 py-2.5 ${!last && 'border-b border-stone'}`}>
      <div className="flex-1 min-w-0">
        <p className="font-serif text-[12px] text-navy leading-tight truncate">{title}</p>
        <p className="font-mono text-[9px] uppercase tracking-widest text-quiet">{meta}</p>
      </div>
      <p className="font-mono text-[11px] text-navy font-tabular font-medium whitespace-nowrap">{kpi}</p>
      <span className={`font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-full ${statusColor}`}>
        {status}
      </span>
    </div>
  );
}
