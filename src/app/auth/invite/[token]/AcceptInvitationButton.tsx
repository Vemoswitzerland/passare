'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, AlertTriangle, ArrowRight } from 'lucide-react';
import { acceptInvitationAction } from './accept-action';

/**
 * Annehmen-Button — nur sichtbar wenn User bereits eingeloggt ist.
 * Ruft accept_invitation RPC auf, schickt User auf das Dashboard.
 */
export function AcceptInvitationButton({ token }: { token: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onClick() {
    setPending(true);
    setError(null);
    try {
      const res = await acceptInvitationAction({ token });
      if (res.ok) {
        // Hard-Refresh um Session-Cookie/Profile zu reloaden
        router.refresh();
        router.push(rolleToDashboard(res.rolle));
      } else {
        setError(errorLabel(res.error));
        setPending(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="w-full inline-flex items-center justify-center gap-2 bg-navy text-cream rounded-soft px-5 py-3 text-body-sm font-medium hover:bg-ink disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {pending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
            Wird angenommen…
          </>
        ) : (
          <>
            <Check className="w-4 h-4" strokeWidth={2} />
            Einladung annehmen
            <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
          </>
        )}
      </button>
      {error && (
        <div className="mt-3 inline-flex items-center gap-2 text-body-sm text-warn">
          <AlertTriangle className="w-4 h-4" strokeWidth={1.75} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

function errorLabel(code?: string): string {
  switch (code) {
    case 'nicht_eingeloggt': return 'Du musst angemeldet sein.';
    case 'token_unbekannt': return 'Diese Einladung gibt es nicht mehr.';
    case 'bereits_eingeloest': return 'Diese Einladung wurde bereits eingelöst.';
    case 'widerrufen': return 'Diese Einladung wurde widerrufen.';
    case 'abgelaufen': return 'Diese Einladung ist abgelaufen.';
    default: return code ? `Fehler: ${code}` : 'Unbekannter Fehler';
  }
}

/**
 * Rolle → Ziel-URL nach erfolgreicher Annahme.
 * Admin landet im Admin-Panel, andere im rolle-spezifischen Dashboard.
 */
function rolleToDashboard(rolle: string): string {
  switch (rolle) {
    case 'admin':       return '/admin';
    case 'broker':      return '/dashboard/broker';
    case 'verkaeufer':  return '/dashboard/verkaeufer';
    case 'kaeufer':     return '/dashboard/kaeufer';
    default:            return '/dashboard';
  }
}
