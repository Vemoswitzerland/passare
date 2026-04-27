import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Mail, Calendar, Lock, Unlock, Info, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  ADMIN_DEMO_ANFRAGEN,
  ADMIN_DEMO_LISTINGS,
  ANFRAGE_STATUS_LABELS,
  type AdminAnfrageStatus,
} from '@/data/admin-demo';
import { cn } from '@/lib/utils';

export const metadata = {
  title: 'Admin · Anfrage-Detail — passare',
  robots: { index: false, follow: false },
};

const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));

const statusStyles: Record<AdminAnfrageStatus, string> = {
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
  const anfrage = ADMIN_DEMO_ANFRAGEN.find((a) => a.id === id);
  if (!anfrage) notFound();

  const inserat = ADMIN_DEMO_LISTINGS.find((l) => l.id === anfrage.inserat_id);

  return (
    <div className="max-w-4xl">
      <Link
        href="/admin/anfragen"
        className="inline-flex items-center gap-1.5 text-body-sm text-quiet hover:text-navy transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
        Zurück zu Anfragen
      </Link>

      <header className="bg-paper border border-stone rounded-card p-6 mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <code className="font-mono text-caption text-quiet">{anfrage.id}</code>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-soft text-caption font-medium border',
              statusStyles[anfrage.status],
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
            {ANFRAGE_STATUS_LABELS[anfrage.status]}
          </span>
          {anfrage.nda_unterschrieben ? (
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
        <h1 className="font-serif text-2xl text-navy mb-2">
          Anfrage von {anfrage.kaeufer_name}
        </h1>
        <p className="text-caption text-quiet">
          <Calendar className="inline w-3.5 h-3.5 mr-1" strokeWidth={1.5} />
          Eingegangen: {formatDateTime(anfrage.created_at)}
        </p>
      </header>

      <div className="bg-bronze/10 border border-bronze/30 rounded-card px-4 py-3 mb-6 flex items-start gap-3">
        <Info className="w-4 h-4 text-bronze-ink flex-shrink-0 mt-0.5" strokeWidth={1.5} />
        <p className="text-body-sm text-navy">
          <strong>Demo-Daten</strong> — die Anfragen-Tabelle und Konversations-Threads kommen in Etappe 50.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-6">
          <section className="bg-paper border border-stone rounded-card p-6">
            <h3 className="font-serif text-xl text-navy mb-4">Konversation</h3>

            <div className="space-y-4">
              <div className="bg-cream border border-stone rounded-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-caption font-medium text-bronze-ink">{anfrage.kaeufer_name}</p>
                  <p className="text-caption text-quiet font-mono">
                    {formatDateTime(anfrage.created_at)}
                  </p>
                </div>
                <p className="text-body-sm text-ink leading-relaxed">{anfrage.nachricht}</p>
              </div>

              <p className="text-caption text-quiet italic text-center py-4">
                Antwort des Verkäufers folgt — echte Konversation kommt in Etappe 50.
              </p>
            </div>
          </section>

          <section className="bg-paper border border-stone rounded-card p-6">
            <h3 className="font-serif text-xl text-navy mb-4">Admin-Aktionen</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <DemoActionButton label="Genehmigen" hint="Anfrage akzeptieren" />
              <DemoActionButton label="Ablehnen" hint="Anfrage zurückweisen" />
              <DemoActionButton label="NDA anfordern" hint="Käufer-NDA erzwingen" />
              <DemoActionButton label="Verkäufer pingen" hint="E-Mail-Reminder" />
            </div>
            <p className="text-caption text-quiet italic mt-4">
              Aktionen sind in V1 deaktiviert — echte Endpoints folgen in Etappe 51.
            </p>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="bg-paper border border-stone rounded-card p-5">
            <h3 className="font-serif text-lg text-navy mb-3 flex items-center gap-2">
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
                  {inserat.id} · {inserat.branche} · {inserat.kanton}
                </p>
                <p className="text-caption text-bronze-ink mt-2">Detail öffnen →</p>
              </Link>
            ) : (
              <p className="text-caption text-quiet italic">Inserat nicht gefunden.</p>
            )}
          </section>

          <section className="bg-paper border border-stone rounded-card p-5">
            <h3 className="font-serif text-lg text-navy mb-3">Käufer</h3>
            <p className="text-body-sm text-ink mb-1">{anfrage.kaeufer_name}</p>
            <p className="text-caption text-quiet font-mono break-all">
              <Mail className="inline w-3.5 h-3.5 mr-1" strokeWidth={1.5} />
              {anfrage.kaeufer_email}
            </p>
            <p className="text-caption text-quiet italic mt-3">
              Verlinkung mit User-Profil folgt sobald Inserate-Tabelle das auth_id Feld erhält.
            </p>
          </section>

          <section className="bg-paper border border-stone rounded-card p-5">
            <h3 className="font-serif text-lg text-navy mb-3">Status-Verlauf</h3>
            <ul className="space-y-2 text-caption">
              <li className="flex items-center justify-between">
                <span className="text-quiet">Eingegangen</span>
                <span className="font-mono text-ink">{formatDateTime(anfrage.created_at)}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-quiet">NDA</span>
                <span className="font-mono text-ink">
                  {anfrage.nda_unterschrieben ? 'signiert' : 'offen'}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-quiet">Aktueller Status</span>
                <span className="font-mono text-ink">{ANFRAGE_STATUS_LABELS[anfrage.status]}</span>
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

function DemoActionButton({ label, hint }: { label: string; hint: string }) {
  return (
    <button
      type="button"
      disabled
      title={`${hint} (kommt in Etappe 51)`}
      className="px-4 py-3 rounded-soft border border-stone bg-cream text-left disabled:cursor-not-allowed disabled:opacity-60"
    >
      <p className="text-body-sm text-ink">{label}</p>
      <p className="text-caption text-quiet">{hint}</p>
    </button>
  );
}
