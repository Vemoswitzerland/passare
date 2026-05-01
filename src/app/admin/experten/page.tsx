import Link from 'next/link';
import { Sparkles, Plus, Calendar, Edit2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Admin · Experten — passare', robots: { index: false, follow: false } };

export default async function AdminExpertenPage() {
  const supabase = await createClient();

  // Alle Experten (auch inaktive — Admin-View)
  const { data: experten } = await supabase
    .from('experten')
    .select('id, name, funktion, expertise, honorar_chf_pro_stunde, is_active, sort_order, created_at')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  // Termin-Counts pro Experte
  const { data: termineCounts } = await supabase
    .from('experten_termine')
    .select('experte_id, status');
  const counts = new Map<string, { total: number; upcoming: number }>();
  const nowIso = new Date().toISOString();
  for (const t of termineCounts ?? []) {
    const eid = t.experte_id as string;
    const entry = counts.get(eid) ?? { total: 0, upcoming: 0 };
    entry.total += 1;
    counts.set(eid, entry);
  }
  // Upcoming separat zählen
  const { data: upcomingTermine } = await supabase
    .from('experten_termine')
    .select('experte_id')
    .gte('start_at', nowIso)
    .in('status', ['pending', 'paid', 'confirmed']);
  for (const t of upcomingTermine ?? []) {
    const eid = t.experte_id as string;
    const entry = counts.get(eid) ?? { total: 0, upcoming: 0 };
    entry.upcoming += 1;
    counts.set(eid, entry);
  }

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <p className="overline text-bronze-ink mb-1">Experten</p>
          <h1 className="font-serif text-head-md text-navy font-light">Berater-Profile verwalten</h1>
          <p className="text-caption text-quiet mt-1">
            Anlegen, Honorar setzen, Verfügbarkeit definieren — Verkäufer sehen alle aktiven Profile.
          </p>
        </div>
        <Link
          href="/admin/experten/neu"
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-navy text-cream rounded-soft text-body-sm font-medium hover:bg-ink transition-colors"
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          Neuer Experte
        </Link>
      </header>

      {!experten || experten.length === 0 ? (
        <div className="rounded-card bg-paper border border-stone p-12 text-center">
          <Sparkles className="w-10 h-10 mx-auto text-quiet mb-3" strokeWidth={1.5} />
          <h3 className="font-serif text-head-sm text-navy mb-1">Noch keine Experten</h3>
          <p className="text-body-sm text-muted mb-4">
            Lege das erste Profil an — die Verkäufer können es sofort buchen.
          </p>
          <Link
            href="/admin/experten/neu"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-bronze text-white rounded-soft text-body-sm font-medium hover:bg-bronze-ink transition-colors"
          >
            <Plus className="w-4 h-4" strokeWidth={1.5} />
            Ersten Experten anlegen
          </Link>
        </div>
      ) : (
        <div className="rounded-card bg-paper border border-stone overflow-hidden">
          <table className="w-full text-body-sm">
            <thead className="bg-stone/30 text-caption text-quiet uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-2">Name</th>
                <th className="text-left px-4 py-2 hidden md:table-cell">Expertise</th>
                <th className="text-right px-4 py-2">Honorar/h</th>
                <th className="text-center px-4 py-2 hidden md:table-cell">Termine</th>
                <th className="text-center px-4 py-2">Status</th>
                <th className="text-right px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone">
              {experten.map((e) => {
                const c = counts.get(e.id as string) ?? { total: 0, upcoming: 0 };
                return (
                  <tr key={e.id as string} className="hover:bg-stone/20">
                    <td className="px-4 py-3">
                      <p className="text-navy font-medium">{e.name as string}</p>
                      {e.funktion && <p className="text-caption text-quiet">{e.funktion as string}</p>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(e.expertise) && (e.expertise as string[]).slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-1.5 py-0.5 rounded-soft bg-bronze-soft text-bronze-ink text-[10px] font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      CHF {Number(e.honorar_chf_pro_stunde).toLocaleString('de-CH')}
                    </td>
                    <td className="px-4 py-3 text-center hidden md:table-cell">
                      <span className="inline-flex items-center gap-1 text-caption text-quiet">
                        <Calendar className="w-3 h-3" strokeWidth={1.5} />
                        {c.upcoming} kommend / {c.total} gesamt
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {e.is_active ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-pill bg-success/15 text-success text-caption font-medium">
                          Aktiv
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-pill bg-stone text-quiet text-caption font-medium">
                          Inaktiv
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/experten/${e.id}`}
                        className="inline-flex items-center gap-1 text-caption text-bronze-ink hover:text-bronze"
                      >
                        <Edit2 className="w-3 h-3" strokeWidth={1.5} />
                        Bearbeiten
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
