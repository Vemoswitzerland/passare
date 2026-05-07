'use client';

import * as React from 'react';
import Link from 'next/link';
import { Mail, X, Loader2, Check, Clock, RotateCcw, ArrowRight } from 'lucide-react';
import { revokeInvitationAction } from './invitation-actions';

type Invitation = {
  id: string;
  email: string;
  rolle: string;
  invited_by_name: string | null;
  expires_at: string;
  accepted_at: string | null;
  accepted_user_id: string | null;
  revoked_at: string | null;
  created_at: string;
  profile: { onboarded: boolean; rolle: string | null } | null;
};

type Status = 'akzeptiert' | 'wartet' | 'widerrufen' | 'abgelaufen';

const ROLLE_LABEL: Record<string, string> = {
  admin: 'Administrator/in',
  broker: 'Broker/in',
  verkaeufer: 'Verkäufer/in',
  kaeufer: 'Käufer/in',
};

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function daysUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

function statusOf(inv: Invitation): Status {
  if (inv.revoked_at) return 'widerrufen';
  if (inv.accepted_at) return 'akzeptiert';
  if (new Date(inv.expires_at) < new Date()) return 'abgelaufen';
  return 'wartet';
}

const STATUS_LABEL: Record<Status, string> = {
  akzeptiert: 'Akzeptiert',
  wartet: 'Wartet auf Registrierung',
  widerrufen: 'Widerrufen',
  abgelaufen: 'Abgelaufen',
};

const STATUS_COLOR: Record<Status, string> = {
  akzeptiert: 'text-success',
  wartet: 'text-bronze-ink',
  widerrufen: 'text-quiet',
  abgelaufen: 'text-quiet',
};

function StatusIcon({ status }: { status: Status }) {
  const cls = STATUS_COLOR[status];
  if (status === 'akzeptiert')
    return <Check className={`w-3.5 h-3.5 ${cls}`} strokeWidth={2.25} />;
  if (status === 'wartet')
    return <Clock className={`w-3.5 h-3.5 ${cls}`} strokeWidth={1.5} />;
  if (status === 'widerrufen')
    return <X className={`w-3.5 h-3.5 ${cls}`} strokeWidth={1.5} />;
  return <RotateCcw className={`w-3.5 h-3.5 ${cls}`} strokeWidth={1.5} />;
}

/**
 * Übersicht aller Einladungen mit klarem Status:
 * — Akzeptiert (mit Onboarded-Häkchen + Link zum User-Profile)
 * — Wartet auf Registrierung (mit Widerruf-Button + Tage bis Ablauf)
 * — Widerrufen / Abgelaufen (gedimmt)
 *
 * Cyrill 07.05.: «Bei akzeptierten Einladungen Häkchen + onboarded-Status,
 * sodass man sieht ob der User wirklich registriert ist».
 */
export function PendingInvitationsList({ items }: { items: Invitation[] }) {
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

  // Gruppieren: oben offene/akzeptierte Einladungen, unten widerrufene/abgelaufene
  const aktiv = visible.filter((i) => {
    const s = statusOf(i);
    return s === 'akzeptiert' || s === 'wartet';
  });
  const inaktiv = visible.filter((i) => {
    const s = statusOf(i);
    return s === 'widerrufen' || s === 'abgelaufen';
  });

  return (
    <div className="border border-stone bg-paper rounded-card mb-6">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-stone">
        <Mail className="w-4 h-4 text-bronze" strokeWidth={1.5} />
        <h2 className="font-mono text-[11px] uppercase tracking-widest text-navy">
          Einladungen ({aktiv.length} aktiv)
        </h2>
      </div>
      <ul className="divide-y divide-stone/60">
        {[...aktiv, ...inaktiv].map((inv) => {
          const status = statusOf(inv);
          const dim = status === 'widerrufen' || status === 'abgelaufen';
          return (
            <li
              key={inv.id}
              className={`flex items-center justify-between gap-4 px-5 py-3 hover:bg-cream/40 transition-colors ${
                dim ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <StatusIcon status={status} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-mono text-[13px] text-ink truncate">{inv.email}</p>
                    <span className="text-caption text-quiet">·</span>
                    <span className="font-mono text-[11px] text-bronze-ink">
                      {ROLLE_LABEL[inv.rolle] ?? inv.rolle}
                    </span>
                    {status === 'akzeptiert' && inv.profile?.onboarded && (
                      <span
                        className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wide text-success"
                        title="User hat Onboarding abgeschlossen"
                      >
                        <Check className="w-3 h-3" strokeWidth={2.5} />
                        onboarded
                      </span>
                    )}
                  </div>
                  <p className="text-caption text-quiet mt-0.5">
                    <span className={STATUS_COLOR[status]}>{STATUS_LABEL[status]}</span>
                    {status === 'akzeptiert' && inv.accepted_at && (
                      <> · am {fmtDate(inv.accepted_at)}</>
                    )}
                    {status === 'wartet' && (
                      <>
                        {' '}· läuft in {daysUntil(inv.expires_at)} Tagen ab
                      </>
                    )}
                    {status === 'widerrufen' && inv.revoked_at && (
                      <> · am {fmtDate(inv.revoked_at)}</>
                    )}
                    {inv.invited_by_name && (
                      <> · eingeladen von {inv.invited_by_name}</>
                    )}
                  </p>
                </div>
              </div>

              {/* Aktion rechts: bei akzeptiert User-Link, bei wartet Widerrufen */}
              {status === 'akzeptiert' && inv.accepted_user_id ? (
                <Link
                  href={`/admin/users/${inv.accepted_user_id}`}
                  className="inline-flex items-center gap-1.5 text-caption text-quiet hover:text-navy transition-colors flex-shrink-0"
                >
                  Profil
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                </Link>
              ) : status === 'wartet' ? (
                <button
                  type="button"
                  onClick={() => onRevoke(inv.id)}
                  disabled={pendingId === inv.id}
                  className="inline-flex items-center gap-1.5 text-caption text-quiet hover:text-warn transition-colors disabled:opacity-50 flex-shrink-0"
                  aria-label="Einladung widerrufen"
                >
                  {pendingId === inv.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} />
                  ) : (
                    <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                  )}
                  Widerrufen
                </button>
              ) : (
                <span className="text-caption text-quiet flex-shrink-0">—</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
