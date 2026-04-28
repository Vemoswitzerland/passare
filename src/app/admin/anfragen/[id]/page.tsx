import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Mail, Calendar, Lock, Unlock, FileText } from 'lucide-react';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { AnfrageActions } from '@/components/admin/AnfrageActions';
import {
  type AdminAnfrage,
  type AdminInserat,
  type AnfrageStatus,
  ANFRAGE_STATUS_LABELS,
  formatDateTime,
} from '@/lib/admin/types';
import { cn } from '@/lib/utils';

export const metadata = {
  title: 'Admin · Anfrage — passare',
  robots: { index: false, follow: false },
};

const statusStyles: Record<AnfrageStatus, string> = {
  offen: 'bg-bronze/15 text-bronze-ink border-bronze/30',
  in_bearbeitung: 'bg-navy-soft text-navy border-navy/20',
  akzeptiert: 'bg-success/10 text-success border-success/30',
  abgelehnt: 'bg-danger/10 text-danger border-danger/30',
};

export default async function AdminAnfrageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('anfragen').select('*').eq('id', id).maybeSingle();
  if (!data) notFound();
  const anfrage = data as AdminAnfrage;

  let inserat: AdminInserat | null = null;
  if (anfrage.inserat_id) {
    const { data: i } = await supabase
      .from('inserate')
      .select('*')
      .eq('id', anfrage.inserat_id)
      .maybeSingle();
    inserat = (i as AdminInserat | null) ?? null;
  }

  let kaeufer: { id: string; full_name: string | null; email: string | null } | null = null;
  if (anfrage.kaeufer_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', anfrage.kaeufer_id)
      .maybeSingle();
    let email: string | null = null;
    try {
      const admin = createAdminClient();
      const { data: au } = await admin.auth.admin.getUserById(anfrage.kaeufer_id);
      type AuthUserShape = { email?: string | null };
      email = ((au as { user?: AuthUserShape } | null)?.user?.email ?? null) || null;
    } catch {
      /* ignore */
    }
    if (profile)
      kaeufer = {
        id: profile.id as string,
        full_name: (profile.full_name as string | null) ?? null,
        email,
      };
  }

  return (
    <div className="max-w-4xl">
      <Link
        href="/admin/anfragen"
        className="inline-flex items-center gap-1.5 text-body-sm text-quiet hover:text-navy transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
        Zurück zu Anfragen
      </Link>

      <header className="bg-paper border border-stone rounded-soft p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <code className="font-mono text-caption text-quiet">
            {anfrage.public_id ?? anfrage.id.slice(0, 8)}
          </code>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-soft text-caption font-medium border',
              statusStyles[anfrage.status],
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
            {ANFRAGE_STATUS_LABELS[anfrage.status]}
          </span>
          {anfrage.nda_signed_at ? (
            <Badge variant="success">
              <Lock className="w-3 h-3" strokeWidth={2} />
              NDA signiert
            </Badge>
          ) : (
            <Badge variant="neutral">
              <Unlock className="w-3 h-3" strokeWidth={2} />
              NDA offen
            </Badge>
          )}
        </div>
        <h1 className="text-base text-navy font-semibold mb-1">
          Anfrage von {kaeufer?.full_name ?? '— Anonym'}
        </h1>
        <p className="text-caption text-quiet">
          <Calendar className="inline w-3.5 h-3.5 mr-1" strokeWidth={1.5} />
          Eingegangen: {formatDateTime(anfrage.created_at)}
        </p>
      </header>

      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-6">
          {anfrage.nachricht && (
            <section className="bg-paper border border-stone rounded-soft p-4">
              <h3 className="text-caption uppercase tracking-wide font-medium text-quiet mb-3">Nachricht</h3>
              <div className="bg-cream border border-stone rounded-soft p-3 whitespace-pre-wrap text-body-sm text-ink leading-relaxed">
                {anfrage.nachricht}
              </div>
            </section>
          )}

          {anfrage.admin_notes && (
            <section className="bg-paper border border-stone rounded-soft p-4">
              <h3 className="text-caption uppercase tracking-wide font-medium text-quiet mb-3">Admin-Notizen</h3>
              <p className="text-body-sm text-ink whitespace-pre-wrap">{anfrage.admin_notes}</p>
            </section>
          )}

          <AnfrageActions
            id={anfrage.id}
            currentStatus={anfrage.status}
            currentNotes={anfrage.admin_notes}
          />
        </div>

        <aside className="space-y-6">
          <section className="bg-paper border border-stone rounded-soft p-4">
            <h3 className="text-caption uppercase tracking-wide font-medium text-quiet mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-quiet" strokeWidth={1.5} />
              Inserat
            </h3>
            {inserat ? (
              <Link
                href={`/admin/inserate/${inserat.id}`}
                className="block hover:bg-cream/60 transition-colors -mx-2 px-2 py-2 rounded-soft"
              >
                <p className="text-body-sm text-ink mb-1">{inserat.titel}</p>
                <p className="text-caption text-quiet font-mono">
                  {inserat.public_id ?? inserat.id.slice(0, 8)}
                </p>
                <p className="text-caption text-bronze-ink mt-2">Detail öffnen →</p>
              </Link>
            ) : (
              <p className="text-caption text-quiet italic">Inserat gelöscht oder nicht verknüpft.</p>
            )}
          </section>

          <section className="bg-paper border border-stone rounded-soft p-4">
            <h3 className="text-caption uppercase tracking-wide font-medium text-quiet mb-3">Käufer</h3>
            {kaeufer ? (
              <Link
                href={`/admin/users/${kaeufer.id}`}
                className="block hover:bg-cream/60 transition-colors -mx-2 px-2 py-2 rounded-soft"
              >
                <p className="text-body-sm text-ink mb-1">{kaeufer.full_name ?? '— ohne Namen'}</p>
                {kaeufer.email && (
                  <p className="text-caption text-quiet font-mono break-all">
                    <Mail className="inline w-3.5 h-3.5 mr-1" strokeWidth={1.5} />
                    {kaeufer.email}
                  </p>
                )}
                <p className="text-caption text-bronze-ink mt-2">User-Profil öffnen →</p>
              </Link>
            ) : (
              <p className="text-caption text-quiet italic">Kein Käufer-Profil verknüpft.</p>
            )}
          </section>

          <section className="bg-paper border border-stone rounded-soft p-4">
            <h3 className="text-caption uppercase tracking-wide font-medium text-quiet mb-3">Status-Verlauf</h3>
            <ul className="space-y-2 text-caption">
              <li className="flex items-center justify-between">
                <span className="text-quiet">Eingegangen</span>
                <span className="font-mono text-ink">{formatDateTime(anfrage.created_at)}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-quiet">NDA</span>
                <span className="font-mono text-ink">
                  {anfrage.nda_signed_at ? formatDateTime(anfrage.nda_signed_at) : 'offen'}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-quiet">Status</span>
                <span className="font-mono text-ink">{ANFRAGE_STATUS_LABELS[anfrage.status]}</span>
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
