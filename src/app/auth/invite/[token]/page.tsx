import Link from 'next/link';
import { AuthShell } from '../../AuthShell';
import { createClient } from '@/lib/supabase/server';
import { AcceptInvitationButton } from './AcceptInvitationButton';

export const metadata = {
  title: 'Einladung — passare',
  robots: { index: false, follow: false },
};

type Invitation = {
  email: string;
  rolle: string;
  invited_by_name: string | null;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
};

const ROLLE_LABEL: Record<string, string> = {
  admin: 'Administrator/in',
  broker: 'Broker/in',
  verkaeufer: 'Verkäufer/in',
  kaeufer: 'Käufer/in',
};

/**
 * Accept-Page für Einladungen.
 *
 * - Token aus URL → public RPC `get_invitation_by_token` für Lookup
 * - Bei invaliden Einladungen klare Fehlermeldung
 * - Bei eingeloggtem User: Button «Einladung annehmen» → setzt Rolle
 * - Bei ausgeloggtem User: Hinweis + Links zu Register/Login mit
 *   `next` Parameter, damit der User nach Anmeldung wieder hier landet
 */
export default async function InviteAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: rpcResult } = await supabase.rpc('get_invitation_by_token', {
    p_token: token,
  });

  const invitation = (
    Array.isArray(rpcResult) && rpcResult.length > 0 ? rpcResult[0] : null
  ) as Invitation | null;

  // Token unbekannt
  if (!invitation) {
    return (
      <AuthShell
        overline="Einladung"
        title="Einladung nicht gefunden."
        intro="Diese Einladung gibt es nicht oder der Link wurde beim Kopieren verstümmelt. Prüfe die E-Mail oder bitte den Absender um eine neue Einladung."
        footer={
          <>
            Schon ein Konto?{' '}
            <Link href="/auth/login" className="editorial text-navy">
              Anmelden
            </Link>
          </>
        }
      >
        <div className="text-center text-body-sm text-quiet">
          Falls du Hilfe brauchst, schreibe uns an{' '}
          <a href="mailto:info@passare.ch" className="text-navy hover:text-bronze">
            info@passare.ch
          </a>
          .
        </div>
      </AuthShell>
    );
  }

  // Bereits akzeptiert
  if (invitation.accepted_at) {
    return (
      <AuthShell
        overline="Einladung"
        title="Schon eingelöst."
        intro={`Diese Einladung wurde am ${new Date(invitation.accepted_at).toLocaleDateString('de-CH')} bereits angenommen.`}
      >
        <div className="text-center">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 bg-navy text-cream rounded-soft px-5 py-3 text-body-sm font-medium hover:bg-ink transition-colors"
          >
            Zur Anmeldung
          </Link>
        </div>
      </AuthShell>
    );
  }

  // Widerrufen
  if (invitation.revoked_at) {
    return (
      <AuthShell
        overline="Einladung"
        title="Einladung widerrufen."
        intro="Diese Einladung wurde inzwischen vom Absender zurückgezogen. Bitte den Absender um eine neue Einladung."
      >
        <div className="text-center text-body-sm text-quiet">
          Fragen? Schreib an{' '}
          <a href="mailto:info@passare.ch" className="text-navy hover:text-bronze">
            info@passare.ch
          </a>
          .
        </div>
      </AuthShell>
    );
  }

  // Abgelaufen
  if (new Date(invitation.expires_at) < new Date()) {
    return (
      <AuthShell
        overline="Einladung"
        title="Einladung abgelaufen."
        intro="Diese Einladung war 14 Tage gültig und ist nun verfallen. Bitte den Absender um eine neue Einladung."
      >
        <div className="text-center text-body-sm text-quiet">
          Schreib an{' '}
          <a href="mailto:info@passare.ch" className="text-navy hover:text-bronze">
            info@passare.ch
          </a>{' '}
          falls du Hilfe brauchst.
        </div>
      </AuthShell>
    );
  }

  // Gültig — eingeloggt oder ausgeloggt?
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  const rolleLabel = ROLLE_LABEL[invitation.rolle] ?? invitation.rolle;

  // Falls eingeloggt aber mit anderer E-Mail: Hinweis (wir akzeptieren
  // trotzdem — Token ist Authority — aber zeigen Warnung).
  const emailMismatch = !!user && user.email && user.email.toLowerCase() !== invitation.email.toLowerCase();

  if (user) {
    return (
      <AuthShell
        overline="Einladung"
        title={`Einladung als ${rolleLabel}`}
        intro={
          invitation.invited_by_name
            ? `${invitation.invited_by_name} hat dich eingeladen. Klicke unten, um die Einladung anzunehmen — deine Rolle wird damit auf «${rolleLabel}» gesetzt.`
            : `Klicke unten, um die Einladung anzunehmen — deine Rolle wird damit auf «${rolleLabel}» gesetzt.`
        }
      >
        <div className="space-y-4">
          {emailMismatch && (
            <div className="rounded-soft border border-warn/40 bg-warn/5 px-4 py-3 text-body-sm text-warn">
              Hinweis: Du bist mit <span className="font-mono">{user.email}</span> angemeldet,
              die Einladung ging an <span className="font-mono">{invitation.email}</span>. Wenn das
              nicht stimmt, melde dich erst ab und folge dem Link erneut.
            </div>
          )}
          <AcceptInvitationButton token={token} />
          <p className="text-caption text-quiet text-center">
            Eingeloggt als <span className="font-mono">{user.email}</span>
          </p>
        </div>
      </AuthShell>
    );
  }

  // Nicht eingeloggt → Hinweis + Register/Login-Links mit next-Param
  const next = encodeURIComponent(`/auth/invite/${token}`);
  return (
    <AuthShell
      overline="Einladung"
      title={`Einladung als ${rolleLabel}`}
      intro={
        invitation.invited_by_name
          ? `${invitation.invited_by_name} hat dich auf passare eingeladen. Erstelle ein Konto oder melde dich an, um die Einladung anzunehmen.`
          : 'Du wurdest auf passare eingeladen. Erstelle ein Konto oder melde dich an, um die Einladung anzunehmen.'
      }
    >
      <div className="space-y-3">
        <Link
          href={`/auth/register?email=${encodeURIComponent(invitation.email)}&next=${next}`}
          className="flex items-center justify-center gap-2 bg-navy text-cream rounded-soft px-5 py-3 text-body-sm font-medium hover:bg-ink transition-colors"
        >
          Konto erstellen
        </Link>
        <Link
          href={`/auth/login?email=${encodeURIComponent(invitation.email)}&next=${next}`}
          className="flex items-center justify-center gap-2 bg-cream border border-stone text-navy rounded-soft px-5 py-3 text-body-sm font-medium hover:border-bronze transition-colors"
        >
          Bereits ein Konto? Anmelden
        </Link>
      </div>
      <p className="mt-5 text-caption text-quiet text-center">
        Einladung an <span className="font-mono">{invitation.email}</span>
      </p>
    </AuthShell>
  );
}

