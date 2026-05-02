import Link from 'next/link';
import { Bell, Crown, Pause, Play, Trash2, Mail, Plus, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { hasTable } from '@/lib/db/has-table';
import { deleteSuchprofilAction, togglePauseSuchprofilAction } from './actions';
import { cn } from '@/lib/utils';
import { isPlusKaeufer } from '@/lib/kaeufer/is-plus';

export const metadata = { title: 'Suchprofile — Käufer · passare', robots: { index: false, follow: false } };

type Suchprofil = {
  id: string;
  name: string;
  branche: string[];
  kantone: string[];
  umsatz_min: number | null;
  umsatz_max: number | null;
  ebitda_min: number | null;
  ma_min: number | null;
  ma_max: number | null;
  email_alert: boolean;
  ist_pausiert: boolean;
  created_at: string;
};

export default async function SuchprofilePage() {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;

  const { data: prof } = await supabase
    .from('profiles')
    .select('subscription_tier, is_broker')
    .eq('id', u.user.id)
    .maybeSingle();
  const isPlus = isPlusKaeufer(prof);

  let profile: Suchprofil[] = [];
  const profileTableExists = await hasTable('suchprofile');
  if (profileTableExists) {
    const { data } = await supabase
      .from('suchprofile')
      .select('*')
      .eq('kaeufer_id', u.user.id)
      .order('created_at', { ascending: true });
    profile = (data ?? []) as Suchprofil[];
  }

  // Recent Alerts
  let recentAlerts: { id: string; suchprofil_id: string; inserat_id: string; channel: string; sent_at: string }[] = [];
  if (await hasTable('alerts_sent')) {
    const ids = profile.map((p) => p.id);
    if (ids.length > 0) {
      const { data } = await supabase
        .from('alerts_sent')
        .select('*')
        .in('suchprofil_id', ids)
        .order('sent_at', { ascending: false })
        .limit(20);
      recentAlerts = data ?? [];
    }
  }

  return (
    <div className="space-y-6 max-w-content">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="overline text-bronze mb-2">Suchprofile · E-Mail-Alerts</p>
          <h1 className="font-serif text-display-sm md:text-head-lg text-navy font-light">
            Suchprofile<span className="text-bronze">.</span>
          </h1>
          <p className="text-body-sm text-muted mt-2 max-w-2xl">
            Definiere deine Such-Kriterien und erhalte automatisch Alerts wenn ein neues Inserat passt.
          </p>
        </div>
        {profileTableExists && (
          <Link
            href="/dashboard/kaeufer/suchprofile/neu"
            className="inline-flex items-center gap-2 px-4 py-2 bg-navy text-cream rounded-soft text-caption font-medium hover:bg-ink transition-colors"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
            Neues Profil
          </Link>
        )}
      </div>

      {!profileTableExists && (
        <div className="bg-warn/5 border border-warn/20 rounded-soft px-4 py-3 inline-flex items-center gap-2 text-caption text-warn">
          <AlertCircle className="w-4 h-4" strokeWidth={1.5} />
          Suchprofil-Tabelle wird beim nächsten Datenbank-Update aktiviert.
        </div>
      )}

      {profile.length === 0 ? (
        <div className="bg-paper border border-dashed border-stone rounded-card p-10 text-center">
          <Bell className="w-8 h-8 text-bronze mx-auto mb-3" strokeWidth={1.5} />
          <p className="font-serif text-head-sm text-navy font-normal mb-2">
            Noch kein Suchprofil aktiv<span className="text-bronze">.</span>
          </p>
          <p className="text-body-sm text-muted mb-5 max-w-md mx-auto">
            Lege jetzt dein erstes Suchprofil an — wir scannen den Marktplatz für dich und schicken dir morgens 7:00 Uhr deinen Daily Digest.
          </p>
          <Link
            href="/dashboard/kaeufer/suchprofile/neu"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy text-cream rounded-soft text-body-sm font-medium hover:bg-ink transition-colors"
          >
            Profil erstellen <Plus className="w-4 h-4" strokeWidth={1.5} />
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {profile.map((p) => (
            <ProfilCard key={p.id} profil={p} isPlus={isPlus} alertCount={recentAlerts.filter((a) => a.suchprofil_id === p.id).length} />
          ))}
        </div>
      )}

      {/* Käufer+-Gate Banner */}
      {!isPlus && profile.length > 0 && (
        <div className="bg-bronze/5 border border-bronze/20 rounded-card p-5 flex items-start gap-3">
          <Crown className="w-5 h-5 text-bronze flex-shrink-0 mt-0.5" strokeWidth={1.5} />
          <div className="flex-1">
            <p className="text-body-sm text-navy font-medium mb-1">Echtzeit-Alerts mit Käufer+</p>
            <p className="text-caption text-muted leading-relaxed">
              Aktuell bekommst du den wöchentlichen E-Mail-Digest. Mit Käufer+ erhältst du Echtzeit-E-Mail-Alerts innerhalb von Sekunden bei einem Match.
            </p>
          </div>
          <Link
            href="/dashboard/kaeufer/abo"
            className="font-mono text-caption uppercase tracking-widest text-bronze-ink hover:text-bronze whitespace-nowrap"
          >
            Käufer+ ansehen →
          </Link>
        </div>
      )}

      {/* Recent Alerts */}
      {recentAlerts.length > 0 && (
        <section>
          <h2 className="font-serif text-head-sm text-navy font-normal mb-3">Letzte Alerts</h2>
          <div className="bg-paper border border-stone rounded-card overflow-hidden">
            <ul className="divide-y divide-stone">
              {recentAlerts.map((a) => {
                const profilName = profile.find((p) => p.id === a.suchprofil_id)?.name ?? '—';
                return (
                  <li key={a.id} className="px-5 py-3 flex items-center justify-between text-caption">
                    <div>
                      <p className="text-navy">{profilName}</p>
                      <p className="text-quiet font-mono">{a.inserat_id}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-quiet">{a.channel}</span>
                      <span className="font-mono text-quiet">
                        {new Date(a.sent_at).toLocaleDateString('de-CH')}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}

function ProfilCard({
  profil, isPlus, alertCount,
}: {
  profil: Suchprofil;
  isPlus: boolean;
  alertCount: number;
}) {
  return (
    <div className={cn(
      'bg-paper border rounded-card p-5',
      profil.ist_pausiert ? 'border-stone/50 opacity-60' : 'border-stone',
    )}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-serif text-head-sm text-navy font-normal leading-tight">
            {profil.name}<span className="text-bronze">.</span>
          </h3>
          <p className="text-caption text-quiet mt-1">
            Erstellt {new Date(profil.created_at).toLocaleDateString('de-CH')} · {alertCount} Alert{alertCount !== 1 && 's'} zuletzt
          </p>
        </div>
        {profil.ist_pausiert && (
          <span className="text-caption font-medium px-2 py-0.5 rounded-pill bg-stone/60 text-quiet">Pausiert</span>
        )}
      </div>

      <dl className="space-y-1.5 text-caption mb-4">
        <FilterLine label="Branche" value={profil.branche.length === 0 ? '—' : profil.branche.slice(0, 3).join(', ') + (profil.branche.length > 3 ? ` +${profil.branche.length - 3}` : '')} />
        <FilterLine label="Kantone" value={profil.kantone.length === 0 ? 'Schweizweit' : profil.kantone.join(', ')} />
        {(profil.umsatz_min || profil.umsatz_max) && (
          <FilterLine
            label="Umsatz"
            value={`${profil.umsatz_min ? `CHF ${(profil.umsatz_min / 1_000_000).toFixed(1)} Mio` : '—'} – ${profil.umsatz_max ? `CHF ${(profil.umsatz_max / 1_000_000).toFixed(0)} Mio` : '—'}`}
          />
        )}
        {profil.ebitda_min !== null && (
          <FilterLine label="EBITDA-Marge" value={`≥ ${profil.ebitda_min}%`} />
        )}
      </dl>

      <div className="flex items-center gap-2 mb-4 pt-3 border-t border-stone">
        <ChannelChip icon={Mail} label={isPlus ? 'Echtzeit-E-Mail' : 'Wöchentlich E-Mail'} active={profil.email_alert} />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <form action={togglePauseSuchprofilAction}>
          <input type="hidden" name="id" value={profil.id} />
          <input type="hidden" name="pause" value={profil.ist_pausiert ? 'false' : 'true'} />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 text-caption text-muted hover:text-navy px-2 py-1 rounded-soft hover:bg-stone/30 transition-colors"
          >
            {profil.ist_pausiert ? <Play className="w-3.5 h-3.5" strokeWidth={1.5} /> : <Pause className="w-3.5 h-3.5" strokeWidth={1.5} />}
            {profil.ist_pausiert ? 'Aktivieren' : 'Pausieren'}
          </button>
        </form>
        <form action={deleteSuchprofilAction}>
          <input type="hidden" name="id" value={profil.id} />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 text-caption text-quiet hover:text-danger px-2 py-1 rounded-soft hover:bg-stone/30 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            Löschen
          </button>
        </form>
      </div>
    </div>
  );
}

function FilterLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="overline text-quiet text-[10px]">{label}</dt>
      <dd className="text-navy text-right font-medium">{value}</dd>
    </div>
  );
}

function ChannelChip({
  icon: Icon, label, active, locked,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  active: boolean;
  locked?: boolean;
}) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-caption px-2 py-0.5 rounded-pill',
      locked
        ? 'bg-stone/40 text-quiet opacity-60'
        : active
        ? 'bg-success/10 text-success'
        : 'bg-stone/60 text-quiet',
    )}>
      <Icon className="w-3 h-3" strokeWidth={1.5} />
      {label}
      {locked && <Crown className="w-2.5 h-2.5 text-bronze" strokeWidth={2} />}
    </span>
  );
}
