import Link from 'next/link';
import { Search, Plus, ArrowRight, Bell } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { hasTable } from '@/lib/db/has-table';

export const metadata = { title: 'Suchprofile — passare Broker' };

export default async function BrokerSuchprofilePage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  let suchprofile: any[] = [];

  if (await hasTable('suchprofile')) {
    const { data } = await supabase
      .from('suchprofile')
      .select('*')
      .eq('kaeufer_id', userData.user.id)
      .order('created_at', { ascending: false });
    suchprofile = data ?? [];
  }

  return (
    <div className="px-6 md:px-10 py-8 md:py-12">
      <div className="max-w-content mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <p className="overline text-bronze-ink mb-2">Käufer+-Suche</p>
            <h1 className="font-serif text-display-sm text-navy font-light tracking-tight">
              Suchprofile
            </h1>
            <p className="text-body text-muted mt-2">
              Suche aktiv im Marktplatz für deine Käufer-Mandate. Echtzeit-Alerts inklusive.
            </p>
          </div>
          <Link
            href="/dashboard/kaeufer/suchprofile/neu"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy text-cream rounded-soft text-body-sm font-medium hover:bg-ink shadow-card hover:shadow-lift hover:-translate-y-px transition-all"
          >
            <Plus className="w-4 h-4" strokeWidth={1.5} />
            Neues Suchprofil
          </Link>
        </div>

        {suchprofile.length === 0 ? (
          <div className="rounded-card bg-paper border border-stone p-10 text-center">
            <Search className="w-10 h-10 text-stone mx-auto mb-4" strokeWidth={1.5} />
            <h2 className="font-serif text-head-md text-navy mb-2">Keine Suchprofile</h2>
            <p className="text-body-sm text-muted max-w-sm mx-auto mb-6">
              Erstelle ein Suchprofil um automatisch E-Mail-Alerts zu erhalten,
              wenn passende Inserate veröffentlicht werden.
            </p>
            <Link
              href="/dashboard/kaeufer/suchprofile/neu"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy text-cream rounded-soft text-body-sm font-medium hover:bg-ink transition-colors"
            >
              <Plus className="w-4 h-4" strokeWidth={1.5} />
              Suchprofil erstellen
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {suchprofile.map((sp: any) => (
              <div
                key={sp.id}
                className="flex items-center gap-4 rounded-card bg-paper border border-stone p-4"
              >
                <div className="w-9 h-9 rounded-soft bg-bronze/10 flex items-center justify-center flex-shrink-0">
                  <Search className="w-4 h-4 text-bronze-ink" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm text-navy font-medium truncate">
                    {sp.label || sp.branchen?.join(', ') || 'Suchprofil'}
                  </p>
                  <p className="text-caption text-muted mt-0.5">
                    {sp.kantone?.join(', ') || 'Alle Kantone'}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Bell className="w-3.5 h-3.5 text-success" strokeWidth={1.5} />
                  <span className="text-[10px] text-success font-medium uppercase">Aktiv</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
