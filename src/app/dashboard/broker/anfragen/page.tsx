import Link from 'next/link';
import { MessageSquare, ArrowRight, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { hasTable } from '@/lib/db/has-table';

export const metadata = { title: 'Anfragen — passare Broker' };

export default async function BrokerAnfragenPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  let anfragen: any[] = [];
  let mandate: any[] = [];

  if (await hasTable('inserate')) {
    const { data: m } = await supabase
      .from('inserate')
      .select('id, firma_name, titel')
      .eq('broker_id', userData.user.id);
    mandate = m ?? [];

    if (mandate.length > 0 && await hasTable('anfragen')) {
      const ids = mandate.map((i: any) => i.id);
      const { data: a } = await supabase
        .from('anfragen')
        .select('id, inserat_id, kaeufer_id, nachricht, status, created_at')
        .in('inserat_id', ids)
        .order('created_at', { ascending: false })
        .limit(50);
      anfragen = a ?? [];
    }
  }

  const mandateMap = new Map(mandate.map((m: any) => [m.id, m]));

  return (
    <div className="px-6 md:px-10 py-8 md:py-12">
      <div className="max-w-content mx-auto">
        <div className="mb-8">
          <p className="overline text-bronze-ink mb-2">Anfragen</p>
          <h1 className="font-serif text-display-sm text-navy font-light tracking-tight">
            Alle Anfragen
          </h1>
          <p className="text-body text-muted mt-2">
            Anfragen über alle deine Mandate kombiniert.
          </p>
        </div>

        {anfragen.length === 0 ? (
          <div className="rounded-card bg-paper border border-stone p-10 text-center">
            <MessageSquare className="w-10 h-10 text-stone mx-auto mb-4" strokeWidth={1.5} />
            <h2 className="font-serif text-head-md text-navy mb-2">Noch keine Anfragen</h2>
            <p className="text-body-sm text-muted max-w-sm mx-auto">
              Sobald Käufer auf deine Mandate anfragen, erscheinen sie hier.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {anfragen.map((a) => {
              const mandat = mandateMap.get(a.inserat_id);
              return (
                <Link
                  key={a.id}
                  href={`/dashboard/verkaeufer/anfragen/${a.id}`}
                  className="group flex items-center gap-4 rounded-card bg-paper border border-stone p-4 hover:border-bronze/40 hover:shadow-card transition-all"
                >
                  <div className="w-9 h-9 rounded-full bg-navy/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-navy" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm text-navy font-medium truncate">
                      Anfrage für {mandat?.firma_name || mandat?.titel || 'Mandat'}
                    </p>
                    {a.nachricht && (
                      <p className="text-caption text-muted truncate mt-0.5">{a.nachricht}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={a.status} />
                    <ArrowRight className="w-4 h-4 text-quiet group-hover:text-bronze-ink transition-colors" strokeWidth={1.5} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    neu: { label: 'Neu', cls: 'bg-bronze/15 text-bronze-ink' },
    in_pruefung: { label: 'In Prüfung', cls: 'bg-warn/15 text-warn' },
    akzeptiert: { label: 'Akzeptiert', cls: 'bg-success/15 text-success' },
    abgelehnt: { label: 'Abgelehnt', cls: 'bg-danger/10 text-danger' },
    nda_pending: { label: 'NDA Pending', cls: 'bg-navy/10 text-navy' },
    nda_signed: { label: 'NDA Signed', cls: 'bg-success/15 text-success' },
    released: { label: 'Freigegeben', cls: 'bg-success/15 text-success' },
    geschlossen: { label: 'Geschlossen', cls: 'bg-stone text-quiet' },
  };
  const entry = map[status] ?? { label: status, cls: 'bg-stone text-quiet' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-pill text-[10px] font-medium uppercase ${entry.cls}`}>
      {entry.label}
    </span>
  );
}
