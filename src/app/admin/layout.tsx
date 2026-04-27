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

  const { data: profile } = await supabase
    .from('profiles')
    .select('rolle, full_name')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (profile?.rolle !== 'admin') redirect('/dashboard');

  // Sidebar-Badges live aus DB
  let pendingInserate = 0;
  let userCount = 0;
  let offeneAnfragen = 0;
  let blogDraftCount = 0;
  try {
    const [{ count: pi }, { count: uc }, { count: oa }, { count: bdc }] = await Promise.all([
      supabase.from('inserate').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('anfragen').select('id', { count: 'exact', head: true }).eq('status', 'offen'),
      supabase.from('blog_posts').select('id', { count: 'exact', head: true }).eq('status', 'entwurf'),
    ]);
    pendingInserate = pi ?? 0;
    userCount = uc ?? 0;
    offeneAnfragen = oa ?? 0;
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
