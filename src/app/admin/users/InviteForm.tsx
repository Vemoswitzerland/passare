'use client';

import * as React from 'react';
import { Mail, Send, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { createInvitationAction } from './invitation-actions';

const ROLLEN = [
  { id: 'admin', label: 'Administrator/in' },
  { id: 'broker', label: 'Broker/in' },
  { id: 'verkaeufer', label: 'Verkäufer/in' },
  { id: 'kaeufer', label: 'Käufer/in' },
] as const;

type Rolle = typeof ROLLEN[number]['id'];

/**
 * Admin-Invite-Form: E-Mail eingeben, Rolle wählen, "Einladung senden".
 * Im Hintergrund wird ein Token generiert, eine Einladungs-E-Mail
 * verschickt und ein Audit-Log geschrieben.
 *
 * Vorlage: Vemo Academy `sendInviteEmail()` aus app.js — gleiche UX
 * (Inline-Form, sofortige Erfolgsmeldung mit Reset).
 */
export function InviteForm() {
  const [email, setEmail] = React.useState('');
  const [rolle, setRolle] = React.useState<Rolle>('admin');
  const [pending, setPending] = React.useState(false);
  const [status, setStatus] = React.useState<
    | { kind: 'idle' }
    | { kind: 'success'; email: string; rolle: string; isNew: boolean }
    | { kind: 'error'; message: string }
  >({ kind: 'idle' });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setStatus({ kind: 'idle' });
    try {
      const res = await createInvitationAction({ email: email.trim(), rolle });
      if (res.ok) {
        setStatus({ kind: 'success', email: res.email, rolle: res.rolle, isNew: res.isNew });
        setEmail('');
        // Nach 4s Status zurücksetzen
        window.setTimeout(() => setStatus({ kind: 'idle' }), 4000);
      } else {
        setStatus({ kind: 'error', message: res.error ?? 'Unbekannter Fehler' });
      }
    } catch (err) {
      setStatus({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Unbekannter Fehler',
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="border border-stone bg-paper rounded-card p-5 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Mail className="w-4 h-4 text-bronze" strokeWidth={1.5} />
        <h2 className="font-mono text-[11px] uppercase tracking-widest text-navy">
          User einladen
        </h2>
      </div>
      <p className="text-body-sm text-muted mb-4 leading-relaxed">
        E-Mail eingeben + Rolle wählen → eine Einladung mit Aktivierungs-Link wird sofort
        versendet. Der Link ist 14 Tage gültig.
      </p>

      <form onSubmit={onSubmit} className="grid sm:grid-cols-[1fr_180px_auto] gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@firma.ch"
          disabled={pending}
          className="bg-cream border border-stone rounded-soft px-3 py-2.5 text-body-sm placeholder:text-quiet focus:outline-none focus:border-bronze disabled:opacity-50"
        />
        <select
          value={rolle}
          onChange={(e) => setRolle(e.target.value as Rolle)}
          disabled={pending}
          className="bg-cream border border-stone rounded-soft px-3 py-2.5 text-body-sm focus:outline-none focus:border-bronze disabled:opacity-50"
        >
          {ROLLEN.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending || !email.trim()}
          className="inline-flex items-center justify-center gap-2 bg-navy text-cream rounded-soft px-5 py-2.5 text-body-sm font-medium hover:bg-ink disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
              Senden…
            </>
          ) : (
            <>
              <Send className="w-4 h-4" strokeWidth={1.5} />
              Einladung senden
            </>
          )}
        </button>
      </form>

      {status.kind === 'success' && (
        <div className="mt-3 inline-flex items-center gap-2 text-body-sm text-success">
          <Check className="w-4 h-4" strokeWidth={2} />
          <span>
            {status.isNew ? 'Einladung gesendet' : 'Einladung erneut gesendet'} an{' '}
            <span className="font-mono">{status.email}</span> ({status.rolle})
          </span>
        </div>
      )}
      {status.kind === 'error' && (
        <div className="mt-3 inline-flex items-center gap-2 text-body-sm text-warn">
          <AlertTriangle className="w-4 h-4" strokeWidth={1.75} />
          <span>{status.message}</span>
        </div>
      )}
    </div>
  );
}
