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
      className="relative w-full max-w-5xl mx-auto"
    >
      {/* Browser-Window-Frame */}
      <div className="bg-navy rounded-card overflow-hidden shadow-lift">
        {/* Titlebar */}
        <div className="flex items-center gap-3 px-4 py-3 bg-navy">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-400/80" />
            <span className="w-3 h-3 rounded-full bg-yellow-400/80" />
            <span className="w-3 h-3 rounded-full bg-green-400/80" />
          </div>
          <div className="flex-1 mx-3">
            <div className="mx-auto max-w-sm bg-ink/50 rounded-full px-4 py-1 text-center">
              <span className="font-mono text-[11px] text-cream/60 tracking-wide">
                app.passare.ch
              </span>
            </div>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-cream/40">
            live
          </span>
        </div>

        {/* App-Content */}
        <div className="bg-cream flex">
          {/* Sidebar */}
          <aside className="hidden md:block w-56 bg-paper border-r border-stone p-5">
            <p className="font-serif text-xl text-navy mb-8">
              passare<span className="text-bronze">.</span>
            </p>

            <nav className="space-y-1">
              <NavItem Icon={LayoutDashboard} label="Dashboard" active />
              <NavItem Icon={FileText} label="Meine Mandate" badge="3" />
              <NavItem Icon={Users} label="Interessenten" badge="12" />
              <NavItem Icon={FileLock2} label="NDA-Prozess" />
              <NavItem Icon={Archive} label="Datenraum" />
              <NavItem Icon={BarChart3} label="Statistiken" />
            </nav>

            <div className="mt-8 pt-6 border-t border-stone">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-navy text-cream flex items-center justify-center font-serif text-sm">
                  M
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-ink truncate">H. Müller</p>
                  <p className="font-mono text-[10px] text-quiet">Verkäufer · ZH</p>
                </div>
              </div>
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1 p-6 md:p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-7">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-quiet mb-1.5">
                  Verkäufer-Dashboard
                </p>
                <h3 className="font-serif text-2xl md:text-3xl text-navy font-light">
                  Guten Morgen, Herr Müller<span className="text-bronze">.</span>
                </h3>
              </div>
              <span className="hidden md:inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-success bg-success/5 border border-success/20 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-dot" />
                online
              </span>
            </div>

            {/* KPI-Grid */}
            <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
              <KpiTile label="Profilaufrufe" value="247" delta="+18" Icon={Eye} />
              <KpiTile label="Anfragen" value="12" delta="+4" Icon={Users} />
              <KpiTile label="NDA signiert" value="5" delta="+2" Icon={ShieldCheck} highlight />
            </div>

            {/* Mandate-Liste */}
            <div className="bg-paper border border-stone rounded-card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-stone">
                <p className="font-mono text-[11px] uppercase tracking-widest text-quiet">
                  Meine Mandate · 3 aktiv
                </p>
                <span className="font-mono text-[10px] text-bronze">● Veröffentlicht</span>
              </div>
              <MandatRow
                title="Spezialmaschinen Präzisionsindustrie"
                meta="Maschinenbau · ZH · 1987"
                kpi="CHF 8.4M"
                kpiLabel="Umsatz"
                status="Live"
              />
              <MandatRow
                title="Regionale Bäckerei mit Filialen"
                meta="Lebensmittel · BE · 1962"
                kpi="18.2%"
                kpiLabel="EBITDA"
                status="NDA"
              />
              <MandatRow
                title="IT-Dienstleister Cloud &amp; Security"
                meta="Technologie · ZG · 2009"
                kpi="34"
                kpiLabel="MA"
                status="Prüfung"
                last
              />
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
      className={`flex items-center justify-between gap-3 px-3 py-2 rounded-soft text-[13px] ${
        active
          ? 'bg-navy text-cream font-medium'
          : 'text-muted hover:bg-cream/60 font-normal'
      }`}
    >
      <span className="flex items-center gap-2.5">
        <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
        {label}
      </span>
      {badge && (
        <span
          className={`font-mono text-[10px] px-1.5 py-0.5 rounded-full ${
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
      className={`p-4 rounded-card border ${
        highlight ? 'bg-navy text-cream border-navy' : 'bg-paper text-ink border-stone'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <p
          className={`font-mono text-[10px] uppercase tracking-widest ${
            highlight ? 'text-cream/60' : 'text-quiet'
          }`}
        >
          {label}
        </p>
        <Icon
          className={`w-3.5 h-3.5 ${highlight ? 'text-bronze' : 'text-bronze'}`}
          strokeWidth={1.5}
        />
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`font-serif text-2xl md:text-3xl font-light font-tabular`}>
          {value}
        </span>
        <span
          className={`font-mono text-[10px] ${
            highlight ? 'text-bronze' : 'text-success'
          }`}
        >
          <TrendingUp className="inline w-2.5 h-2.5 mr-0.5" strokeWidth={2} />
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
  kpiLabel,
  status,
  last,
}: {
  title: string;
  meta: string;
  kpi: string;
  kpiLabel: string;
  status: string;
  last?: boolean;
}) {
  const statusColor =
    status === 'Live'
      ? 'bg-success/10 text-success'
      : status === 'NDA'
      ? 'bg-bronze/15 text-bronze-ink'
      : 'bg-stone/50 text-muted';

  return (
    <div
      className={`flex items-center gap-4 px-5 py-4 ${!last && 'border-b border-stone'}`}
    >
      <div className="flex-1 min-w-0">
        <p className="font-serif text-[15px] text-navy leading-snug mb-1 truncate">{title}</p>
        <p className="font-mono text-[10px] uppercase tracking-widest text-quiet">
          {meta}
        </p>
      </div>
      <div className="hidden sm:block text-right">
        <p className="font-mono text-[14px] text-navy font-tabular font-medium">{kpi}</p>
        <p className="font-mono text-[10px] text-quiet uppercase tracking-widest">
          {kpiLabel}
        </p>
      </div>
      <span
        className={`font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full ${statusColor}`}
      >
        {status}
      </span>
    </div>
  );
}
