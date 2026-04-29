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

  // Auth-Gate: User OHNE Rolle/Onboarding kommen NIE blind ins Verkäufer-
  // Dashboard. Sie müssen zuerst über /onboarding ihre Rolle wählen.
  // (Früher haben wir hier defensiv rolle=verkaeufer gesetzt — das war
  // der Bug, der OAuth-User automatisch zum Verkäufer machte.)
  if (!profile || !profile.onboarding_completed_at) {
    redirect('/onboarding');
  }
  if (profile.rolle === 'kaeufer') {
    redirect('/dashboard/kaeufer');
  }
  if (profile.rolle !== 'verkaeufer' && profile.rolle !== 'admin') {
    redirect('/onboarding');
  }

  const finalProfile = profile ?? {
    full_name: userData.user.user_metadata?.full_name ?? null,
    rolle: 'verkaeufer',
    onboarding_completed_at: new Date().toISOString(),
  };
  const isAdmin = finalProfile.rolle === 'admin';

  // Inserat & Counts laden — defensiv (Tabellen existieren ggf. noch nicht in DB)
  let inseratId: string | null = null;
  let inseratStatus: string | null = null;
  let paket: string | null = null;
  let paidAt: string | null = null;
  let counts = { anfragenNeu: 0, ndaPending: 0, datenraumFiles: 0 };

  if (await hasTable('inserate')) {
    // Tunnel-Mode-Entscheidung soll auf das AKTIV bearbeitete Inserat
    // schauen, NICHT auf das neueste insgesamt. Strategie:
    //  1. Wenn URL eine Inserat-ID enthält (/inserat/[id]/edit) → DIESES laden
    //  2. Sonst: erst nach unbezahltem Entwurf suchen
    //  3. Sonst: neuestes Inserat (für Sidebar-Counts)
    const pathHeader = (await headers()).get('x-pathname') ?? '';
    const urlInseratMatch = pathHeader.match(/\/inserat\/([0-9a-f-]{36})/);
    const urlInseratId = urlInseratMatch?.[1] ?? null;

    let inserat: any = null;
    if (urlInseratId) {
      const { data } = await supabase
        .from('inserate')
        .select('id, status, paket, paid_at')
        .eq('id', urlInseratId)
        .eq('verkaeufer_id', userData.user.id)
        .maybeSingle();
      inserat = data;
    }
    if (!inserat) {
      const { data: draftInserat } = await supabase
        .from('inserate')
        .select('id, status, paket, paid_at')
        .eq('verkaeufer_id', userData.user.id)
        .eq('status', 'entwurf')
        .is('paid_at', null)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      inserat = draftInserat ?? (await supabase
        .from('inserate')
        .select('id, status, paket, paid_at')
        .eq('verkaeufer_id', userData.user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()).data;
    }

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
      <TunnelShell email={userData.user.email ?? ''} fullName={finalProfile.full_name}>
        {children}
      </TunnelShell>
    );
  }

  return (
    <VerkaeuferShell
      email={userData.user.email ?? ''}
      fullName={finalProfile.full_name}
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
