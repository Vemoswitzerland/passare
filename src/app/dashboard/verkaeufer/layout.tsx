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

  // Profile-Reparatur statt Redirect-Loop: wer auf /dashboard/verkaeufer
  // landet, ist eindeutig Verkäufer. Profile direkt setzen wenn nicht
  // sauber — verhindert Onboarding-Loop endgültig.
  // Defensiv mit try/catch — selbst wenn DB/RLS hickt, Seite rendert.
  if (!profile || !profile.onboarding_completed_at || (profile.rolle !== 'verkaeufer' && profile.rolle !== 'admin')) {
    try {
      const { data: fixed, error: fixErr } = await supabase
        .from('profiles')
        .upsert({
          id: userData.user.id,
          rolle: profile?.rolle === 'admin' ? 'admin' : 'verkaeufer',
          full_name: profile?.full_name ?? userData.user.user_metadata?.full_name ?? '',
          sprache: (profile as any)?.sprache ?? userData.user.user_metadata?.sprache ?? 'de',
          onboarding_completed_at: new Date().toISOString(),
        }, { onConflict: 'id' })
        .select('full_name, rolle, onboarding_completed_at')
        .maybeSingle();

      if (fixErr) {
        console.warn('[verkaeufer-layout] profile-upsert failed:', fixErr.message);
      } else if (fixed) {
        Object.assign(profile ?? {}, fixed);
      }
    } catch (e) {
      console.warn('[verkaeufer-layout] profile-upsert exception:', e);
    }
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
    // schauen, nicht auf das neueste insgesamt. Falls der User mehrere
    // Inserate hat (z.B. eines bezahlt + ein neuer Entwurf), ist nur
    // der neue Entwurf "im Tunnel".
    //
    // Strategie: erst nach unbezahltem Entwurf suchen, sonst neuestes
    // bezahltes (für Sidebar-Counts).
    const { data: draftInserat } = await supabase
      .from('inserate')
      .select('id, status, paket, paid_at')
      .eq('verkaeufer_id', userData.user.id)
      .eq('status', 'entwurf')
      .is('paid_at', null)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const inserat = draftInserat ?? (await supabase
      .from('inserate')
      .select('id, status, paket, paid_at')
      .eq('verkaeufer_id', userData.user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()).data;

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
