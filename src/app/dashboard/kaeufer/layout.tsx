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

  // Phase 1: profile + table-existence-checks parallel — 1 Roundtrip statt 5.
  // Pipeline-Query wurde komplett entfernt (Cyrill: «Pipeline brauchts nicht»).
  const userId = u.user.id;
  const [{ data: profile }, hasFavoriten, hasSuchprofile, hasAnfragen, hasNdaSig] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('full_name, rolle, onboarding_completed_at, subscription_tier')
        .eq('id', userId)
        .maybeSingle(),
      hasTable('favoriten'),
      hasTable('suchprofile'),
      hasTable('anfragen'),
      hasTable('nda_signaturen'),
    ]);

  // Loop-Vermeidung: KEIN automatischer Redirect zum Tunnel mehr.
  // Wer das Onboarding nicht abgeschlossen hat, sieht das Dashboard
  // mit einem prominenten «Profil vervollständigen»-Banner — siehe page.tsx.

  // Admin darf den Käufer-Bereich auch betreten (zum Testen via View-Switcher)
  const isAdmin = profile?.rolle === 'admin';
  // Nur Verkäufer wegleiten — alle anderen (kaeufer, admin, null) durch
  if (profile?.rolle === 'verkaeufer') redirect('/dashboard/verkaeufer');

  const isMax = profile?.subscription_tier === 'max';

  // Phase 2: alle Count-Queries parallel — 1 Roundtrip statt 4.
  // Supabase wirft nicht — bei Schema-Drift kommt einfach {count: null, error: …}
  // zurück und unsere `?? 0`-Fallbacks greifen.
  const [favRes, suchRes, anfRes, ndaRes] = await Promise.all([
    hasFavoriten
      ? supabase.from('favoriten').select('*', { count: 'exact', head: true }).eq('kaeufer_id', userId)
      : null,
    hasSuchprofile
      ? supabase.from('suchprofile').select('*', { count: 'exact', head: true }).eq('kaeufer_id', userId)
      : null,
    hasAnfragen
      ? supabase
          .from('anfragen')
          .select('*', { count: 'exact', head: true })
          .eq('kaeufer_id', userId)
          .in('status', ['neu', 'in_pruefung', 'akzeptiert', 'nda_pending'])
      : null,
    hasNdaSig && hasAnfragen
      ? supabase
          .from('nda_signaturen')
          .select('*, anfragen!inner(kaeufer_id)', { count: 'exact', head: true })
          .eq('anfragen.kaeufer_id', userId)
      : null,
  ]);

  if (anfRes?.error) console.warn('[kaeufer-layout] anfragen-count failed:', anfRes.error.message);
  if (ndaRes?.error) console.warn('[kaeufer-layout] nda-count failed:', ndaRes.error.message);

  const counts: SidebarCounts = {
    favoriten: favRes?.count ?? 0,
    suchprofile: suchRes?.count ?? 0,
    anfragen: anfRes?.count ?? 0,
    ndas: ndaRes?.count ?? 0,
  };

  return (
    <KaeuferShell
      email={u.user.email ?? ''}
      fullName={profile?.full_name ?? null}
      isMax={isMax}
      isAdmin={isAdmin}
      counts={counts}
    >
      {children}
    </KaeuferShell>
  );
}
