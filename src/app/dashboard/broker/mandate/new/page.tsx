import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { hasTable } from '@/lib/db/has-table';
import { NewMandatWizard } from './NewMandatWizard';

export const metadata = { title: 'Neues Mandat — passare Broker' };
export const dynamic = 'force-dynamic';

export default async function NewMandatPage() {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) redirect('/auth/login?next=/dashboard/broker/mandate/new');

  // Mandate-Limit-Check vor dem Funnel — nicht den User durchklicken lassen
  // wenn er sein Limit eh schon erreicht hat.
  let mandateLimit = 5;
  let activeCount = 0;
  let isActive = false;

  if (await hasTable('broker_profiles')) {
    const { data: bp } = await supabase
      .from('broker_profiles')
      .select('mandate_limit, subscription_status')
      .eq('id', u.user.id)
      .maybeSingle();
    if (bp) {
      mandateLimit = bp.mandate_limit ?? 5;
      isActive = bp.subscription_status === 'active';
    }
  }

  if (await hasTable('inserate')) {
    const { count } = await supabase
      .from('inserate')
      .select('id', { count: 'exact', head: true })
      .eq('broker_id', u.user.id)
      .not('status', 'in', '("verkauft","abgelaufen")');
    activeCount = count ?? 0;
  }

  const limitReached = activeCount >= mandateLimit;

  return (
    <div className="px-6 md:px-10 py-8 md:py-12">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/dashboard/broker/mandate"
          className="inline-flex items-center gap-1.5 text-caption text-quiet hover:text-navy transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
          Zurück zu Mandaten
        </Link>

        <div className="mb-6">
          <p className="overline text-bronze-ink mb-2">Neues Mandat</p>
          <h1 className="font-serif text-display-sm text-navy font-light tracking-tight">
            Mandat anlegen
          </h1>
          <p className="text-body text-muted mt-2 max-w-prose">
            Suche das Zielunternehmen direkt im Schweizer Handelsregister — wir übernehmen Name, Rechtsform, Sitz und schlagen die Branche vor.
          </p>
        </div>

        {!isActive ? (
          <div className="rounded-card bg-warn/10 border border-warn/30 p-5">
            <p className="text-body text-navy font-medium">Broker-Abo nicht aktiv</p>
            <p className="text-body-sm text-muted mt-1 mb-3">
              Aktiviere zuerst dein Abo, um neue Mandate anzulegen.
            </p>
            <Link
              href="/dashboard/broker/paket"
              className="inline-flex items-center gap-2 px-4 py-2 bg-navy text-cream rounded-soft text-body-sm font-medium hover:bg-ink transition-colors"
            >
              Zum Paket
            </Link>
          </div>
        ) : limitReached ? (
          <div className="rounded-card bg-warn/10 border border-warn/30 p-5">
            <p className="text-body text-navy font-medium">
              Mandate-Limit erreicht ({activeCount} / {mandateLimit})
            </p>
            <p className="text-body-sm text-muted mt-1 mb-3">
              Schliesse ein bestehendes Mandat ab oder upgrade auf Pro für bis zu 25 Mandate.
            </p>
            <Link
              href="/dashboard/broker/paket"
              className="inline-flex items-center gap-2 px-4 py-2 bg-navy text-cream rounded-soft text-body-sm font-medium hover:bg-ink transition-colors"
            >
              Auf Pro upgraden
            </Link>
          </div>
        ) : (
          <NewMandatWizard remaining={mandateLimit - activeCount} />
        )}
      </div>
    </div>
  );
}
