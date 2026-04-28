import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminShell } from '@/components/admin/AdminShell';

export const metadata = {
  title: 'Admin — passare',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect('/auth/login?next=/admin');

  // PERF: Profile + alle Counts in 2 parallelen DB-Roundtrips (statt 5)
  const [{ data: profile }, { data: countsData }] = await Promise.all([
    supabase.from('profiles').select('rolle, full_name').eq('id', userData.user.id).maybeSingle(),
    supabase.rpc('admin_dashboard_counts').single(),
  ]);

  if (profile?.rolle !== 'admin') redirect('/dashboard');

  type DashCounts = {
    total_users: number;
    pending_inserate: number;
    offene_anfragen: number;
    blog_drafts: number;
  };
  const c = (countsData ?? {}) as Partial<DashCounts>;

  const badges = {
    '/admin/inserate': c.pending_inserate ? c.pending_inserate : undefined,
    '/admin/users': c.total_users ? c.total_users : undefined,
    '/admin/anfragen': c.offene_anfragen ? c.offene_anfragen : undefined,
    '/admin/blog': c.blog_drafts ? c.blog_drafts : undefined,
  };

  return (
    <AdminShell
      email={userData.user.email ?? ''}
      fullName={profile?.full_name ?? null}
      badges={badges}
    >
      {children}
    </AdminShell>
  );
}
