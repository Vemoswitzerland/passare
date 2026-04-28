import { FileSignature, Clock, Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { hasTable } from '@/lib/db/has-table';

export const metadata = { title: 'NDA — passare Verkäufer' };

export default async function NDAPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  if (!(await hasTable('nda_signaturen'))) {
    return <NoData />;
  }

  const { data: inserat } = await supabase
    .from('inserate')
    .select('id, titel')
    .eq('verkaeufer_id', userData.user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!inserat) return <NoData message="Erstelle zuerst ein Inserat." />;

  const { data: anfragen } = await supabase
    .from('anfragen')
    .select('id, kaeufer_id, status, created_at, profiles:kaeufer_id(full_name), nda_signaturen(id, status, signed_at, signed_name, expires_at)')
    .eq('inserat_id', inserat.id)
    .in('status', ['akzeptiert', 'nda_pending', 'nda_signed', 'released']);

  const pending = (anfragen ?? []).filter((a: any) => a.status === 'akzeptiert' || a.status === 'nda_pending');
  const signed = (anfragen ?? []).filter((a: any) => a.status === 'nda_signed');
  const released = (anfragen ?? []).filter((a: any) => a.status === 'released');

  return (
    <div className="px-6 md:px-10 py-8 md:py-12">
      <div className="max-w-content mx-auto">
        <div className="mb-8">
          <p className="overline text-bronze-ink mb-2">NDA</p>
          <h1 className="font-serif text-display-sm text-navy font-light tracking-tight">
            NDA-Pipeline
          </h1>
          <p className="text-body text-muted mt-2">
            Vom akzeptierten Käufer zur signierten NDA bis zum Datenraum-Zugang.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <Column
            title="Akzeptiert · NDA ausstehend"
            count={pending.length}
            color="warn"
            icon={Clock}
            anfragen={pending as any[]}
            statusLabel="Wartet auf NDA-Signatur"
          />
          <Column
            title="NDA signiert"
            count={signed.length}
            color="success"
            icon={Check}
            anfragen={signed as any[]}
            statusLabel="Bereit für Datenraum-Freigabe"
            ctaHref="/dashboard/verkaeufer/anfragen"
            ctaLabel="In Anfragen freigeben"
          />
          <Column
            title="Datenraum freigegeben"
            count={released.length}
            color="bronze"
            icon={ArrowRight}
            anfragen={released as any[]}
            statusLabel="Hat Zugriff auf Datenraum"
          />
        </div>
      </div>
    </div>
  );
}

function NoData({ message }: { message?: string }) {
  return (
    <div className="px-6 py-16 text-center">
      <FileSignature className="w-12 h-12 mx-auto text-quiet mb-4" strokeWidth={1.5} />
      <h2 className="font-serif text-head-md text-navy mb-2">Noch keine NDA-Pipeline</h2>
      <p className="text-body text-muted">{message ?? 'Sobald Anfragen reinkommen, siehst du hier deren NDA-Status.'}</p>
    </div>
  );
}

function Column({
  title, count, color, icon: Icon, anfragen, statusLabel, ctaHref, ctaLabel,
}: {
  title: string;
  count: number;
  color: 'warn' | 'success' | 'bronze';
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  anfragen: any[];
  statusLabel: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  const cls = {
    warn: 'border-warn/30 bg-warn/5',
    success: 'border-success/30 bg-success/5',
    bronze: 'border-bronze/30 bg-bronze/5',
  }[color];

  return (
    <div className={`rounded-card border p-4 ${cls}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-head-sm text-navy">
          <Icon className="w-4 h-4 inline mr-2 -mt-0.5" strokeWidth={1.5} />
          {title}
        </h3>
        <span className="font-mono text-caption text-bronze-ink font-medium">{count}</span>
      </div>
      <div className="space-y-2">
        {anfragen.length === 0 ? (
          <p className="text-caption text-quiet text-center py-6">Keine Einträge</p>
        ) : (
          anfragen.map((a) => {
            const nda = (a.nda_signaturen ?? [])[0];
            return (
              <div key={a.id} className="rounded-soft bg-paper border border-stone p-3">
                <p className="text-body-sm text-navy font-medium truncate">
                  {a.profiles?.full_name ?? 'Anonym'}
                </p>
                <p className="text-caption text-quiet mt-1">{statusLabel}</p>
                {nda?.signed_at && (
                  <p className="text-caption text-quiet mt-1 font-mono">
                    Signiert: {new Date(nda.signed_at).toLocaleDateString('de-CH')}
                  </p>
                )}
                {nda?.expires_at && (
                  <p className="text-caption text-quiet font-mono">
                    Gültig bis: {new Date(nda.expires_at).toLocaleDateString('de-CH')}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
      {ctaHref && ctaLabel && anfragen.length > 0 && (
        <Link
          href={ctaHref}
          className="block mt-3 text-center text-body-sm text-bronze-ink hover:underline"
        >
          {ctaLabel} →
        </Link>
      )}
    </div>
  );
}
