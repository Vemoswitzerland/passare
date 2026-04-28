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
 */
const getCachedCounts = unstable_cache(
  async () => {
    try {
      const admin = createAdminClient();
      const { data, error } = await admin.rpc('admin_dashboard_counts').single();
      if (error || !data) return null;
      return data as {
        total_users: number;
        pending_inserate: number;
        offene_anfragen: number;
        blog_drafts: number;
      };
    } catch {
      return null;
    }
  },
  ['admin-dashboard-counts'],
  { revalidate: 30, tags: ['admin-counts'] },
);

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
    '/admin/inserate': counts?.pending_inserate ? counts.pending_inserate : undefined,
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
