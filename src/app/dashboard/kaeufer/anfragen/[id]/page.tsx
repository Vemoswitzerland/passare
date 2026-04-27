import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { hasTable } from '@/lib/db/has-table';

export const metadata = { title: 'Anfrage — Käufer · passare', robots: { index: false, follow: false } };

type Props = { params: Promise<{ id: string }> };

export default async function AnfrageDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;

  const tableExists = await hasTable('anfragen');

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href="/dashboard/kaeufer/anfragen"
        className="inline-flex items-center gap-2 font-mono text-caption uppercase tracking-widest text-quiet hover:text-navy"
      >
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
        Zurück zur Inbox
      </Link>

      <div className="bg-paper border border-stone rounded-card p-6 md:p-8">
        <p className="overline text-bronze mb-2">Anfrage {id}</p>
        <h1 className="font-serif text-head-lg text-navy font-light mb-4">
          Nachrichten-Verlauf<span className="text-bronze">.</span>
        </h1>

        {!tableExists ? (
          <div className="bg-warn/5 border border-warn/20 rounded-soft px-4 py-3 inline-flex items-center gap-2 text-caption text-warn">
            <AlertCircle className="w-4 h-4" strokeWidth={1.5} />
            Die Anfragen-Tabelle wird gerade vom Verkäufer-Bereich aufgebaut. Sobald sie steht, siehst du hier den vollständigen Thread.
          </div>
        ) : (
          <p className="text-body-sm text-muted">
            Lade Anfrage-Details … (Thread-View kommt wenn `anfragen` + `nachrichten`-Tabellen aus Etappe 15 stehen.)
          </p>
        )}
      </div>
    </div>
  );
}
