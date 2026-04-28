import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { hasTable } from '@/lib/db/has-table';
import { VerkaeuferShell } from './components/Shell';
import { TunnelShell } from './components/TunnelShell';

export const metadata = {
  title: 'Verkäufer-Dashboard — passare',
  robots: { index: false, follow: false },
};

export default async function VerkaeuferLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect('/auth/login?next=/dashboard/verkaeufer');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, rolle, onboarding_completed_at')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (!profile) redirect('/auth/login');
  if (!profile.onboarding_completed_at) redirect('/onboarding');

  const isAdmin = profile.rolle === 'admin';
  if (profile.rolle !== 'verkaeufer' && !isAdmin) {
    redirect('/dashboard');
  }

  // Inserat & Counts laden — defensiv (Tabellen existieren ggf. noch nicht in DB)
  let inseratId: string | null = null;
  let inseratStatus: string | null = null;
  let paket: string | null = null;
  let paidAt: string | null = null;
  let counts = { anfragenNeu: 0, ndaPending: 0, datenraumFiles: 0 };

  if (await hasTable('inserate')) {
    const { data: inserat } = await supabase
      .from('inserate')
      .select('id, status, paket, paid_at')
      .eq('verkaeufer_id', userData.user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (inserat) {
      inseratId = inserat.id;
      inseratStatus = inserat.status;
      paket = inserat.paket;
      paidAt = inserat.paid_at;

      if (await hasTable('anfragen')) {
        const { count: anfragenNeu } = await supabase
          .from('anfragen')
          .select('id', { count: 'exact', head: true })
          .eq('inserat_id', inserat.id)
          .eq('status', 'neu');
        counts.anfragenNeu = anfragenNeu ?? 0;
      }

      if (await hasTable('nda_signaturen')) {
        const { count: ndaPending } = await supabase
          .from('nda_signaturen')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending');
        counts.ndaPending = ndaPending ?? 0;
      }

      if (await hasTable('datenraum_files')) {
        const { count: dat } = await supabase
          .from('datenraum_files')
          .select('id', { count: 'exact', head: true })
          .eq('inserat_id', inserat.id);
        counts.datenraumFiles = dat ?? 0;
      }
    }
  }

  // ── TUNNEL-MODE für /inserat und /checkout vor Bezahlung ────────
  // Wenn noch nicht bezahlt UND der User aktuell IM Wizard ist
  // (/inserat oder /checkout), zeigen wir die schlanke Tunnel-Shell
  // ohne Sidebar — fokussiert. Sonstige Verkäufer-Bereiche bleiben
  // erreichbar (z.B. wenn User zwischendrin verlässt → Dashboard mit
  // "Inserat fortsetzen"-Banner).
  const h = await headers();
  const currentPath = h.get('x-pathname') ?? '';
  const isInTunnelRoute =
    currentPath.includes('/dashboard/verkaeufer/inserat') ||
    currentPath.includes('/dashboard/verkaeufer/checkout');
  const showTunnelShell = !paidAt && !isAdmin && isInTunnelRoute;

  if (showTunnelShell) {
    return (
      <TunnelShell email={userData.user.email ?? ''} fullName={profile.full_name}>
        {children}
      </TunnelShell>
    );
  }

  return (
    <VerkaeuferShell
      email={userData.user.email ?? ''}
      fullName={profile.full_name}
      isAdmin={isAdmin}
      inseratId={inseratId}
      inseratStatus={inseratStatus}
      paket={paket}
      counts={counts}
    >
      {children}
    </VerkaeuferShell>
  );
}
