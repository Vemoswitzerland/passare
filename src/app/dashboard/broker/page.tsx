import Link from 'next/link';
import { FileText, MessageSquare, Search, Users, ArrowRight, Plus, Building2, Eye } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { hasTable } from '@/lib/db/has-table';

export const metadata = { title: 'Übersicht — passare Broker' };

export default async function BrokerDashboard() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  let brokerProfile: any = null;
  let mandateActive = 0;
  let mandateTotal = 0;
  let anfragenNeu = 0;
  let anfragenTotal = 0;
  let viewsTotal = 0;
  let suchprofileCount = 0;

  if (await hasTable('broker_profiles')) {
    const { data: bp } = await supabase
      .from('broker_profiles')
      .select('*')
      .eq('id', userData.user.id)
      .maybeSingle();
    brokerProfile = bp;
  }

  if (await hasTable('inserate')) {
    const { data: mandate } = await supabase
      .from('inserate')
      .select('id, status, views')
      .eq('broker_id', userData.user.id);

    if (mandate) {
      mandateTotal = mandate.length;
      mandateActive = mandate.filter((m: any) => !['verkauft', 'abgelaufen'].includes(m.status)).length;
      viewsTotal = mandate.reduce((sum: number, m: any) => sum + (m.views ?? 0), 0);

      if (await hasTable('anfragen')) {
        const ids = mandate.map((m: any) => m.id);
        if (ids.length > 0) {
          const { data: anfr } = await supabase
            .from('anfragen')
            .select('id, status')
            .in('inserat_id', ids);
          if (anfr) {
            anfragenTotal = anfr.length;
            anfragenNeu = anfr.filter((a: any) => a.status === 'neu').length;
          }
        }
      }
    }
  }

  if (await hasTable('suchprofile')) {
    const { count } = await supabase
      .from('suchprofile')
      .select('id', { count: 'exact', head: true })
      .eq('kaeufer_id', userData.user.id);
    suchprofileCount = count ?? 0;
  }

  const mandateLimit = brokerProfile?.mandate_limit ?? 5;
  const isActive = brokerProfile?.subscription_status === 'active';

  return (
    <div className="px-6 md:px-10 py-8 md:py-12">
      <div className="max-w-content mx-auto">
        {/* Abo-Warnung */}
        {!isActive && (
          <div className="rounded-card bg-warn/10 border border-warn/30 p-5 mb-8">
            <p className="text-body text-navy font-medium">Dein Broker-Abo ist nicht aktiv</p>
            <p className="text-body-sm text-muted mt-1">
              Schliesse das Onboarding ab oder aktiviere dein Abo, um Mandate zu erstellen.
            </p>
            <Link
              href="/dashboard/broker/paket"
              className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-navy text-cream rounded-soft text-body-sm font-medium hover:bg-ink transition-colors"
            >
              Abo aktivieren <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </Link>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <p className="overline text-bronze-ink mb-2">Broker-Übersicht</p>
            <h1 className="font-serif text-display-sm text-navy font-light tracking-tight">
              {brokerProfile?.agentur_name ? `${brokerProfile.agentur_name}` : 'Willkommen.'}
            </h1>
            {brokerProfile?.agentur_name && (
              <p className="text-body text-muted mt-2 inline-flex items-center gap-2">
                <Building2 className="w-4 h-4 text-bronze-ink" strokeWidth={1.5} />
                {mandateActive} / {mandateLimit} Mandate aktiv
              </p>
            )}
          </div>
          {isActive && (
            <Link
              href="/dashboard/broker/mandate?action=new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-navy text-cream rounded-soft text-body-sm font-medium hover:bg-ink shadow-card hover:shadow-lift hover:-translate-y-px transition-all"
            >
              <Plus className="w-4 h-4" strokeWidth={1.5} />
              Neues Mandat
            </Link>
          )}
        </div>

        {/* KPI-Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <KPITile
            label="Aktive Mandate"
            value={`${mandateActive}`}
            sub={`von ${mandateLimit} verfügbar`}
            icon={FileText}
            tone={mandateActive > 0 ? 'success' : 'default'}
          />
          <KPITile
            label="Views gesamt"
            value={viewsTotal.toString()}
            sub="über alle Mandate"
            icon={Eye}
          />
          <KPITile
            label="Anfragen"
            value={anfragenTotal.toString()}
            sub={anfragenNeu > 0 ? `${anfragenNeu} neu` : 'Keine neuen'}
            tone={anfragenNeu > 0 ? 'bronze' : 'default'}
            icon={MessageSquare}
          />
          <KPITile
            label="Suchprofile"
            value={suchprofileCount.toString()}
            sub="Käufer-Suchen aktiv"
            icon={Search}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4">
          <QuickAction
            href="/dashboard/broker/mandate"
            icon={FileText}
            title="Mandate verwalten"
            desc={mandateActive > 0 ? `${mandateActive} aktive Mandate` : 'Erstelle dein erstes Mandat'}
          />
          <QuickAction
            href="/dashboard/broker/anfragen"
            icon={MessageSquare}
            title="Anfragen prüfen"
            desc={anfragenNeu > 0 ? `${anfragenNeu} neue Anfragen` : 'Alle bearbeitet'}
            badge={anfragenNeu > 0 ? String(anfragenNeu) : undefined}
          />
          <QuickAction
            href="/dashboard/broker/suchprofile"
            icon={Search}
            title="Suchprofile"
            desc="Käufer+-Suche für deine Mandanten"
          />
        </div>
      </div>
    </div>
  );
}

function KPITile({
  label, value, sub, icon: Icon, tone = 'default',
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  tone?: 'default' | 'success' | 'bronze';
}) {
  return (
    <div className="rounded-card bg-paper border border-stone p-5 hover:shadow-card transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <span className="overline text-quiet">{label}</span>
        <Icon className={
          tone === 'success' ? 'w-4 h-4 text-success' :
          tone === 'bronze' ? 'w-4 h-4 text-bronze-ink' :
          'w-4 h-4 text-quiet'
        } strokeWidth={1.5} />
      </div>
      <p className="font-serif text-head-lg text-navy font-light font-tabular leading-none">{value}</p>
      {sub && <p className="text-caption text-muted mt-2">{sub}</p>}
    </div>
  );
}

function QuickAction({
  href, icon: Icon, title, desc, badge,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  desc: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-card bg-paper border border-stone p-5 hover:border-bronze/40 hover:shadow-card hover:-translate-y-px transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <Icon className="w-5 h-5 text-bronze-ink" strokeWidth={1.5} />
        {badge && (
          <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-pill bg-bronze text-cream text-caption font-mono font-medium">
            {badge}
          </span>
        )}
      </div>
      <p className="font-serif text-head-sm text-navy mb-1">{title}</p>
      <p className="text-caption text-muted">{desc}</p>
      <p className="mt-3 text-caption text-bronze-ink inline-flex items-center gap-1 group-hover:gap-2 transition-all">
        Öffnen <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
      </p>
    </Link>
  );
}
