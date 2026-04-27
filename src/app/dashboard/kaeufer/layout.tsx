import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { hasTable } from '@/lib/db/has-table';
import { KaeuferShell } from '@/components/kaeufer/shell';
import type { SidebarCounts } from '@/components/kaeufer/sidebar-nav';

export const metadata = {
  title: 'Käufer-Dashboard — passare',
  robots: { index: false, follow: false },
};

export default async function KaeuferLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) redirect('/auth/login?next=/dashboard/kaeufer');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, rolle, onboarding_completed_at, subscription_tier')
    .eq('id', u.user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed_at) redirect('/onboarding/kaeufer/tunnel');

  // Admin darf den Käufer-Bereich auch betreten (zum Testen via View-Switcher)
  const isAdmin = profile.rolle === 'admin';
  const isKaeufer = profile.rolle === 'kaeufer';
  if (!isKaeufer && !isAdmin) redirect('/dashboard');

  const isMax = profile.subscription_tier === 'max';

  // Counts aggregieren — defensive
  const counts: SidebarCounts = {
    favoriten: 0,
    suchprofile: 0,
    pipeline: { neu: 0, kontaktiert: 0, nda: 0, dd: 0, loi: 0, won: 0, lost: 0 },
  };

  if (await hasTable('favoriten')) {
    const { count } = await supabase
      .from('favoriten')
      .select('*', { count: 'exact', head: true })
      .eq('kaeufer_id', u.user.id);
    counts.favoriten = count ?? 0;

    // Pipeline-Stage-Counts
    const { data: stages } = await supabase
      .from('favoriten')
      .select('stage')
      .eq('kaeufer_id', u.user.id);
    if (stages) {
      for (const row of stages) {
        const s = row.stage as keyof NonNullable<SidebarCounts['pipeline']>;
        if (counts.pipeline && s in counts.pipeline) counts.pipeline[s] += 1;
      }
    }
  }

  if (await hasTable('suchprofile')) {
    const { count } = await supabase
      .from('suchprofile')
      .select('*', { count: 'exact', head: true })
      .eq('kaeufer_id', u.user.id);
    counts.suchprofile = count ?? 0;
  }

  // Anfragen + NDAs sind aus Chat 2 — defensive
  if (await hasTable('anfragen')) {
    const { count } = await supabase
      .from('anfragen')
      .select('*', { count: 'exact', head: true })
      .eq('kaeufer_id', u.user.id)
      .in('status', ['offen', 'pending', 'in_bearbeitung']);
    counts.anfragen = count ?? 0;
  }

  if (await hasTable('nda_signaturen')) {
    const { count } = await supabase
      .from('nda_signaturen')
      .select('*', { count: 'exact', head: true })
      .eq('kaeufer_id', u.user.id);
    counts.ndas = count ?? 0;
  }

  return (
    <KaeuferShell
      email={u.user.email ?? ''}
      fullName={profile.full_name}
      isMax={isMax}
      isAdmin={isAdmin}
      counts={counts}
    >
      {children}
    </KaeuferShell>
  );
}
