import { redirect } from 'next/navigation';
import { MessageSquare, Inbox, Clock, Check, X as XIcon, FileSignature, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { hasTable } from '@/lib/db/has-table';
import { AnfragenList } from './AnfragenList';

export const metadata = { title: 'Anfragen — passare Verkäufer' };

type Props = { searchParams: Promise<{ filter?: string }> };

export default async function AnfragenPage({ searchParams }: Props) {
  const { filter } = await searchParams;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  if (!(await hasTable('anfragen'))) {
    return (
      <div className="px-6 py-16 text-center">
        <Inbox className="w-12 h-12 mx-auto text-quiet mb-4" strokeWidth={1.5} />
        <h2 className="font-serif text-head-md text-navy mb-2">Anfragen werden noch eingerichtet</h2>
        <p className="text-body text-muted">Sobald ein Käufer dein Inserat anschreibt, siehst du es hier.</p>
      </div>
    );
  }

  const { data: inserat } = await supabase
    .from('inserate')
    .select('id, titel')
    .eq('owner_id', userData.user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!inserat) {
    return (
      <div className="px-6 py-16 text-center">
        <Inbox className="w-12 h-12 mx-auto text-quiet mb-4" strokeWidth={1.5} />
        <h2 className="font-serif text-head-md text-navy mb-2">Noch kein Inserat</h2>
        <p className="text-body text-muted">Erstelle zuerst ein Inserat, dann kommen hier Anfragen rein.</p>
      </div>
    );
  }

  let q = supabase
    .from('anfragen')
    .select('id, kaeufer_id, message, status, score, created_at, decline_reason, profiles:kaeufer_id(full_name, kanton, sprache, verified_phone, verified_kyc, created_at)')
    .eq('inserat_id', inserat.id)
    .order('created_at', { ascending: false });

  if (filter === 'neu') q = q.eq('status', 'neu');
  else if (filter === 'aktiv') q = q.in('status', ['neu', 'in_pruefung', 'akzeptiert', 'nda_pending', 'nda_signed']);
  else if (filter === 'abgeschlossen') q = q.in('status', ['released', 'abgelehnt', 'geschlossen']);

  const { data: anfragen } = await q;

  return (
    <div className="px-6 md:px-10 py-8 md:py-12">
      <div className="max-w-content mx-auto">
        <div className="mb-8">
          <p className="overline text-bronze-ink mb-2">Anfragen</p>
          <h1 className="font-serif text-display-sm text-navy font-light tracking-tight">
            Eingehende Käufer-Anfragen
          </h1>
          <p className="text-body text-muted mt-2">
            {anfragen?.length ?? 0} Anfragen für «{inserat.titel ?? 'Inserat'}»
          </p>
        </div>

        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <FilterPill href="/dashboard/verkaeufer/anfragen" active={!filter} label="Alle" />
          <FilterPill href="/dashboard/verkaeufer/anfragen?filter=neu" active={filter === 'neu'} label="Neu" />
          <FilterPill href="/dashboard/verkaeufer/anfragen?filter=aktiv" active={filter === 'aktiv'} label="In Bearbeitung" />
          <FilterPill href="/dashboard/verkaeufer/anfragen?filter=abgeschlossen" active={filter === 'abgeschlossen'} label="Abgeschlossen" />
        </div>

        <AnfragenList anfragen={(anfragen ?? []) as any} />
      </div>
    </div>
  );
}

function FilterPill({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <a
      href={href}
      className={
        active
          ? 'inline-flex items-center px-4 py-2 rounded-pill bg-navy text-cream text-caption font-medium whitespace-nowrap'
          : 'inline-flex items-center px-4 py-2 rounded-pill border border-stone bg-paper text-caption text-muted hover:border-bronze/40 hover:text-navy whitespace-nowrap transition-colors'
      }
    >
      {label}
    </a>
  );
}
