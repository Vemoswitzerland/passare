import Link from 'next/link';
import { Bell, Pause, Play, Trash2, Mail, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { hasTable } from '@/lib/db/has-table';
import {
  deleteSuchprofilAction,
  togglePauseSuchprofilAction,
} from '../../kaeufer/suchprofile/actions';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Suchprofile — passare Broker', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

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

export default async function BrokerSuchprofilePage() {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;

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

  // Recent Alerts (gleicher Mechanismus wie im Käufer-Bereich)
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
    <div className="px-6 md:px-10 py-8 md:py-12">
      <div className="max-w-content mx-auto space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="overline text-bronze-ink mb-2">Suchen · Käufer+ inklusive</p>
            <h1 className="font-serif text-display-sm text-navy font-light tracking-tight">
              Suchprofile
            </h1>
            <p className="text-body-sm text-muted mt-2 max-w-2xl">
              Suche aktiv im Marktplatz — Echtzeit-Alerts, sobald ein passendes Inserat veröffentlicht wird. Ideal für deine Käufer-Mandate.
            </p>
          </div>
          {profileTableExists && (
            <Link
              href="/dashboard/broker/suchprofile/neu"
              className="inline-flex items-center gap-2 px-4 py-2 bg-navy text-cream rounded-soft text-caption font-medium hover:bg-ink transition-colors"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
              Neues Profil
            </Link>
          )}
        </div>

        {profile.length === 0 ? (
          <div className="bg-paper border border-dashed border-stone rounded-card p-10 text-center">
            <Bell className="w-8 h-8 text-bronze mx-auto mb-3" strokeWidth={1.5} />
            <p className="font-serif text-head-sm text-navy font-normal mb-2">
              Noch kein Suchprofil aktiv
            </p>
            <p className="text-body-sm text-muted mb-5 max-w-md mx-auto">
              Lege jetzt ein Suchprofil an — wir scannen den Marktplatz und schicken dir Alerts in Echtzeit.
            </p>
            <Link
              href="/dashboard/broker/suchprofile/neu"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy text-cream rounded-soft text-body-sm font-medium hover:bg-ink transition-colors"
            >
              Profil erstellen <Plus className="w-4 h-4" strokeWidth={1.5} />
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {profile.map((p) => (
              <ProfilCard
                key={p.id}
                profil={p}
                alertCount={recentAlerts.filter((a) => a.suchprofil_id === p.id).length}
              />
            ))}
          </div>
        )}

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
    </div>
  );
}

function ProfilCard({
  profil,
  alertCount,
}: {
  profil: Suchprofil;
  alertCount: number;
}) {
  return (
    <div
      className={cn(
        'bg-paper border rounded-card p-5',
        profil.ist_pausiert ? 'border-stone/50 opacity-60' : 'border-stone',
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-serif text-head-sm text-navy font-normal leading-tight">
            {profil.name}
          </h3>
          <p className="text-caption text-quiet mt-1">
            Erstellt {new Date(profil.created_at).toLocaleDateString('de-CH')} · {alertCount} Alert
            {alertCount !== 1 && 's'} zuletzt
          </p>
        </div>
        {profil.ist_pausiert && (
          <span className="text-caption font-medium px-2 py-0.5 rounded-pill bg-stone/60 text-quiet">
            Pausiert
          </span>
        )}
      </div>

      <dl className="space-y-1.5 text-caption mb-4">
        <FilterLine
          label="Branche"
          value={
            profil.branche.length === 0
              ? '—'
              : profil.branche.slice(0, 3).join(', ') +
                (profil.branche.length > 3 ? ` +${profil.branche.length - 3}` : '')
          }
        />
        <FilterLine
          label="Kantone"
          value={profil.kantone.length === 0 ? 'Schweizweit' : profil.kantone.join(', ')}
        />
        {(profil.umsatz_min || profil.umsatz_max) && (
          <FilterLine
            label="Umsatz"
            value={`${
              profil.umsatz_min ? `CHF ${(profil.umsatz_min / 1_000_000).toFixed(1)} Mio` : '—'
            } – ${
              profil.umsatz_max ? `CHF ${(profil.umsatz_max / 1_000_000).toFixed(0)} Mio` : '—'
            }`}
          />
        )}
        {profil.ebitda_min !== null && (
          <FilterLine label="EBITDA-Marge" value={`≥ ${profil.ebitda_min}%`} />
        )}
      </dl>

      <div className="flex items-center gap-2 mb-4 pt-3 border-t border-stone">
        <span
          className={cn(
            'inline-flex items-center gap-1 text-caption px-2 py-0.5 rounded-pill',
            profil.email_alert ? 'bg-success/10 text-success' : 'bg-stone/60 text-quiet',
          )}
        >
          <Mail className="w-3 h-3" strokeWidth={1.5} />
          Echtzeit-E-Mail
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <form action={togglePauseSuchprofilAction}>
          <input type="hidden" name="id" value={profil.id} />
          <input type="hidden" name="pause" value={profil.ist_pausiert ? 'false' : 'true'} />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 text-caption text-muted hover:text-navy px-2 py-1 rounded-soft hover:bg-stone/30 transition-colors"
          >
            {profil.ist_pausiert ? (
              <Play className="w-3.5 h-3.5" strokeWidth={1.5} />
            ) : (
              <Pause className="w-3.5 h-3.5" strokeWidth={1.5} />
            )}
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
