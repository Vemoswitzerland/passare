import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminShell } from '@/components/admin/AdminShell';
import { ADMIN_DEMO_LISTINGS, ADMIN_DEMO_ANFRAGEN } from '@/data/admin-demo';

export const metadata = {
  title: 'Admin — passare',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect('/auth/login?next=/admin');

  const { data: profile } = await supabase
    .from('profiles')
    .select('rolle, full_name')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (profile?.rolle !== 'admin') redirect('/dashboard');

  const pendingInserate = ADMIN_DEMO_LISTINGS.filter((l) => l.admin_status === 'pending').length;
  const offeneAnfragen = ADMIN_DEMO_ANFRAGEN.filter((a) => a.status === 'offen').length;

  let userCount = 0;
  let blogDraftCount = 0;
  try {
    const [{ count: uc }, { count: bdc }] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('blog_posts').select('id', { count: 'exact', head: true }).eq('status', 'entwurf'),
    ]);
    userCount = uc ?? 0;
    blogDraftCount = bdc ?? 0;
  } catch {
    /* ignore */
  }

  const badges = {
    '/admin/inserate': pendingInserate > 0 ? pendingInserate : undefined,
    '/admin/users': userCount > 0 ? userCount : undefined,
    '/admin/anfragen': offeneAnfragen > 0 ? offeneAnfragen : undefined,
    '/admin/blog': blogDraftCount > 0 ? blogDraftCount : undefined,
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
