import { redirect } from 'next/navigation';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { AdminShell } from '@/components/admin/AdminShell';

export const metadata = {
  title: 'Admin — passare',
  robots: { index: false, follow: false },
};

/**
 * PERF: Counts werden 30 Sekunden gecacht. Bei Tab-Wechsel innerhalb der
 * Admin-Session muss nicht jedesmal die DB neu befragt werden für die
 * Sidebar-Badges. Service-Role-Client umgeht User-Auth — counts sind global.
 *
 * Zusätzlich: total_inserate für Smart-Badge "X / Y" (X = pending, Y = total).
 * Cyrill 30.04.2026: «kein 1 von 1 angeboten» — wenn pending == total dann
 * zeigen wir nur eine Zahl, sonst "X / Y" für Kontext.
 */
const getCachedCounts = unstable_cache(
  async () => {
    try {
      const admin = createAdminClient();
      const [rpcRes, totalIns] = await Promise.all([
        admin.rpc('admin_dashboard_counts').single(),
        admin.from('inserate').select('id', { count: 'exact', head: true }),
      ]);
      const rpcData = rpcRes.data as
        | {
            total_users: number;
            pending_inserate: number;
            offene_anfragen: number;
            blog_drafts: number;
          }
        | null;
      if (rpcRes.error || !rpcData) return null;
      return {
        ...rpcData,
        total_inserate: totalIns.count ?? 0,
      };
    } catch {
      return null;
    }
  },
  ['admin-dashboard-counts'],
  { revalidate: 30, tags: ['admin-counts'] },
);

/**
 * Smart-Badge fürs Inserate-Item:
 *  • Beide leer → kein Badge (jungfräuliches System)
 *  • Nur pending = 0 (aber Inserate da) → Total als Sidebar-Hinweis (sonst
 *    weiss Admin nicht ob die Tabelle leer oder einfach alles freigegeben ist)
 *  • pending == total → einfach die Zahl ("1" statt "1 / 1", weil das mit
 *    sich selber zu vergleichen sinnlos ist — Cyrill's Wunsch)
 *  • sonst → "X / Y" zur Kontextualisierung (z.B. "3 / 12")
 */
function inserateBadge(
  pending: number | undefined,
  total: number | undefined,
): string | number | undefined {
  const p = pending ?? 0;
  const t = total ?? 0;
  if (!p && !t) return undefined;
  if (!p) return t;
  if (!t || t === p) return p;
  return `${p} / ${t}`;
}

/**
 * PERF: React `cache()` dedupliziert die Profile-Lookups innerhalb EINES
 * Server-Renders. Wenn Layout + Page beide das Profile brauchen, wird's
 * nur einmal gequeryt.
 */
const getAdminProfile = cache(async () => {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, rolle, full_name, email')
    .eq('id', userData.user.id)
    .maybeSingle();
  return { user: userData.user, profile };
});

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // PERF: Auth-Check + Counts parallel (Counts kommt aus 30s-Cache, ist sub-ms)
  const [adminData, counts] = await Promise.all([getAdminProfile(), getCachedCounts()]);

  if (!adminData?.user) redirect('/auth/login?next=/admin');
  if (adminData.profile?.rolle !== 'admin') redirect('/dashboard');

  const badges = {
    '/admin/inserate': inserateBadge(counts?.pending_inserate, counts?.total_inserate),
    '/admin/users': counts?.total_users ? counts.total_users : undefined,
    '/admin/anfragen': counts?.offene_anfragen ? counts.offene_anfragen : undefined,
    '/admin/blog': counts?.blog_drafts ? counts.blog_drafts : undefined,
  };

  return (
    <AdminShell
      email={adminData.profile?.email ?? adminData.user.email ?? ''}
      fullName={adminData.profile?.full_name ?? null}
      badges={badges}
    >
      {children}
    </AdminShell>
  );
}
