import Link from 'next/link';
import { ArrowRight, FileLock2, Eye, Calendar, UserPlus, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { hasTable } from '@/lib/db/has-table';
import { cn } from '@/lib/utils';

export const metadata = { title: 'NDAs & Datenraum — Käufer · passare', robots: { index: false, follow: false } };

type NDA = {
  id: string;
  inserat_id: string;
  inserat_titel?: string | null;
  signed_at: string;
  expires_at: string;
  datenraum_status?: string;
  views?: number;
};

export default async function NDAsPage() {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;

  const ndaExists = await hasTable('nda_signaturen');
  let ndas: NDA[] = [];
  if (ndaExists) {
    const { data } = await supabase
      .from('nda_signaturen')
      .select('*')
      .eq('kaeufer_id', u.user.id)
      .order('signed_at', { ascending: false });
    ndas = (data ?? []) as NDA[];
  }

  // Berater-Shares aus eigener Tabelle
  let beraterShares: { id: string; berater_email: string; expires_at: string; revoked_at: string | null; views_count: number }[] = [];
  if (await hasTable('nda_berater_shares')) {
    const { data } = await supabase
      .from('nda_berater_shares')
      .select('id, berater_email, expires_at, revoked_at, views_count')
      .eq('kaeufer_id', u.user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    beraterShares = data ?? [];
  }

  return (
    <div className="space-y-6 max-w-content">
      <div>
        <p className="overline text-bronze mb-2">Vertraulich · Datenraum-Zugriff</p>
        <h1 className="font-serif text-display-sm md:text-head-lg text-navy font-light">
          NDAs & Datenraum<span className="text-bronze">.</span>
        </h1>
        <p className="text-body-sm text-muted mt-2 max-w-2xl">
          Alle NDAs die du unterzeichnet hast — mit Datenraum-Zugang und der Möglichkeit, deinem Steuerberater oder Anwalt einen zeitlich begrenzten Read-Only-Link zu geben.
        </p>
      </div>

      {/* Aktive NDAs */}
      <section>
        <h2 className="font-serif text-head-sm text-navy font-normal mb-3">Aktive NDAs</h2>

        {!ndaExists || ndas.length === 0 ? (
          <div className="bg-paper border border-dashed border-stone rounded-card p-10 text-center">
            <FileLock2 className="w-8 h-8 text-bronze mx-auto mb-3" strokeWidth={1.5} />
            <p className="font-serif text-head-sm text-navy font-normal mb-2">
              Noch keine NDAs unterzeichnet<span className="text-bronze">.</span>
            </p>
            <p className="text-body-sm text-muted mb-5 max-w-md mx-auto">
              Sobald du im Marktplatz Dossier-Anfragen stellst und der Verkäufer freigibt, kannst du das NDA digital unterzeichnen — und dann auf den Datenraum mit allen Detail-Unterlagen zugreifen.
            </p>
            {!ndaExists && (
              <p className="text-caption text-warn bg-warn/5 border border-warn/20 rounded-soft px-3 py-2 inline-flex items-center gap-2 mb-4">
                <AlertCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
                NDA-Tabelle wird gerade vom Verkäufer-Bereich aufgebaut
              </p>
            )}
            <div>
              <Link
                href="/kaufen"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy text-cream rounded-soft text-body-sm font-medium hover:bg-ink transition-colors"
              >
                Zum Marktplatz <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {ndas.map((nda) => <NDACard key={nda.id} nda={nda} />)}
          </div>
        )}
      </section>

      {/* Berater-Shares */}
      <section>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
          <div>
            <h2 className="font-serif text-head-sm text-navy font-normal">Berater-Zugänge</h2>
            <p className="text-caption text-muted mt-1">
              Lade deinen Steuerberater oder Anwalt zeitlich begrenzt in den Datenraum ein (max. 14 Tage).
            </p>
          </div>
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-2 px-4 py-2 border border-stone rounded-soft text-caption font-medium text-quiet cursor-not-allowed"
          >
            <UserPlus className="w-3.5 h-3.5" strokeWidth={1.5} />
            Berater einladen
          </button>
        </div>

        {beraterShares.length === 0 ? (
          <p className="text-caption text-quiet italic">Noch keine Berater-Zugänge erstellt.</p>
        ) : (
          <div className="bg-paper border border-stone rounded-card overflow-hidden">
            <ul className="divide-y divide-stone">
              {beraterShares.map((s) => (
                <li key={s.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-body-sm text-navy">{s.berater_email}</p>
                    <p className="text-caption text-quiet font-mono">
                      Läuft ab am {new Date(s.expires_at).toLocaleDateString('de-CH')} · {s.views_count} Zugriffe
                    </p>
                  </div>
                  <span className={cn(
                    'text-caption font-medium px-2.5 py-1 rounded-pill',
                    s.revoked_at
                      ? 'bg-danger/5 text-danger'
                      : new Date(s.expires_at) < new Date()
                      ? 'bg-stone/60 text-quiet'
                      : 'bg-success/10 text-success',
                  )}>
                    {s.revoked_at ? 'Entzogen' : new Date(s.expires_at) < new Date() ? 'Abgelaufen' : 'Aktiv'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

function NDACard({ nda }: { nda: NDA }) {
  const expiresAt = new Date(nda.expires_at);
  const daysLeft = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const expired = daysLeft === 0;

  return (
    <div className="bg-paper border border-stone rounded-card p-5">
      <div className="flex items-baseline justify-between mb-2 gap-2">
        <p className="font-mono text-caption text-quiet">{nda.inserat_id}</p>
        <span className={cn(
          'text-caption font-medium px-2 py-0.5 rounded-pill',
          expired ? 'bg-stone/60 text-quiet' : 'bg-success/10 text-success',
        )}>
          {expired ? 'Abgelaufen' : `Aktiv · ${daysLeft}d`}
        </span>
      </div>
      <h3 className="font-serif text-head-sm text-navy font-normal leading-snug mb-3">
        {nda.inserat_titel ?? 'Inserat'}
      </h3>
      <dl className="space-y-2 text-caption mb-4">
        <div className="flex items-center justify-between">
          <dt className="text-quiet flex items-center gap-1.5">
            <Calendar className="w-3 h-3" strokeWidth={1.5} />
            Unterzeichnet
          </dt>
          <dd className="font-mono text-navy">{new Date(nda.signed_at).toLocaleDateString('de-CH')}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-quiet flex items-center gap-1.5">
            <Eye className="w-3 h-3" strokeWidth={1.5} />
            Zugriffe
          </dt>
          <dd className="font-mono text-navy">{nda.views ?? 0}×</dd>
        </div>
      </dl>
      <Link
        href={`/dashboard/kaeufer/anfragen?inserat=${nda.inserat_id}`}
        className={cn(
          'w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-soft text-caption font-medium transition-colors',
          expired ? 'bg-stone/60 text-quiet cursor-not-allowed' : 'bg-navy text-cream hover:bg-ink',
        )}
      >
        <FileLock2 className="w-3.5 h-3.5" strokeWidth={1.5} />
        Anfrage öffnen
      </Link>
    </div>
  );
}
