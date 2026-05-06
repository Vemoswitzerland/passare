'use client';

import * as React from 'react';
import { Clock, X, Loader2 } from 'lucide-react';
import { revokeInvitationAction } from './invitation-actions';

type Item = {
  id: string;
  email: string;
  rolle: string;
  invited_by_name: string | null;
  expires_at: string;
  created_at: string;
};

const ROLLE_LABEL: Record<string, string> = {
  admin: 'Administrator/in',
  broker: 'Broker/in',
  verkaeufer: 'Verkäufer/in',
  kaeufer: 'Käufer/in',
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function daysUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

/**
 * Liste der offenen Einladungen — gibt Admins Übersicht und einen
 * Widerruf-Button pro Eintrag. Akzeptierte oder abgelaufene Einladungen
 * werden serverseitig schon ausgefiltert.
 */
export function PendingInvitationsList({ items }: { items: Item[] }) {
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [removed, setRemoved] = React.useState<Set<string>>(() => new Set());

  async function onRevoke(id: string) {
    if (pendingId) return;
    if (!window.confirm('Einladung wirklich widerrufen?')) return;
    setPendingId(id);
    try {
      const res = await revokeInvitationAction({ id });
      if (res.ok) {
        setRemoved((prev) => new Set([...prev, id]));
      } else {
        window.alert('Widerruf fehlgeschlagen: ' + (res.error ?? 'unbekannter Fehler'));
      }
    } finally {
      setPendingId(null);
    }
  }

  const visible = items.filter((i) => !removed.has(i.id));
  if (visible.length === 0) return null;

  return (
    <div className="border border-stone bg-paper rounded-card p-5 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-bronze" strokeWidth={1.5} />
        <h2 className="font-mono text-[11px] uppercase tracking-widest text-navy">
          Offene Einladungen ({visible.length})
        </h2>
      </div>
      <ul className="divide-y divide-stone -mx-5">
        {visible.map((inv) => {
          const tage = daysUntil(inv.expires_at);
          return (
            <li
              key={inv.id}
              className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-cream/50 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[13px] text-ink truncate">{inv.email}</p>
                <p className="text-caption text-quiet mt-0.5">
                  <span className="font-mono">{ROLLE_LABEL[inv.rolle] ?? inv.rolle}</span>
                  {inv.invited_by_name && <> · von {inv.invited_by_name}</>} · gesendet{' '}
                  {fmtDate(inv.created_at)} · läuft in {tage} {tage === 1 ? 'Tag' : 'Tagen'} ab
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRevoke(inv.id)}
                disabled={pendingId === inv.id}
                className="inline-flex items-center gap-1.5 text-caption text-quiet hover:text-warn transition-colors disabled:opacity-50"
                aria-label="Einladung widerrufen"
              >
                {pendingId === inv.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} />
                ) : (
                  <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                )}
                Widerrufen
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
