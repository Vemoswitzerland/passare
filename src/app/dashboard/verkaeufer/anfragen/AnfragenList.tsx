'use client';

import { useState, useTransition } from 'react';
import { Check, X as XIcon, MessageSquare, ShieldCheck, Phone, MapPin, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { setAnfrageStatus } from './actions';
import { cn } from '@/lib/utils';

type Anfrage = {
  id: string;
  kaeufer_id: string;
  message: string | null;
  status: string;
  score: number | null;
  decline_reason: string | null;
  created_at: string;
  profiles: {
    full_name: string | null;
    kanton: string | null;
    verified_phone: boolean;
    verified_kyc: boolean;
    created_at: string;
  } | null;
};

export function AnfragenList({ anfragen }: { anfragen: Anfrage[] }) {
  const [open, setOpen] = useState<Anfrage | null>(null);

  if (anfragen.length === 0) {
    return (
      <div className="rounded-card bg-paper border border-stone p-12 text-center">
        <MessageSquare className="w-10 h-10 mx-auto text-quiet mb-3" strokeWidth={1.5} />
        <h3 className="font-serif text-head-sm text-navy mb-1">Noch keine Anfragen</h3>
        <p className="text-body-sm text-muted">Sobald Käufer dein Inserat anschreiben, siehst du sie hier.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-card bg-paper border border-stone overflow-hidden">
        <ul className="divide-y divide-stone">
          {anfragen.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => setOpen(a)}
                className="w-full px-5 py-4 text-left hover:bg-stone/30 transition-colors flex items-start gap-4"
              >
                <Avatar name={a.profiles?.full_name ?? 'Käufer'} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <p className="text-body-sm text-navy font-medium">
                      {a.profiles?.full_name ?? 'Anonymer Käufer'}
                    </p>
                    {a.profiles?.verified_kyc && (
                      <span className="inline-flex items-center gap-1 text-caption text-success">
                        <ShieldCheck className="w-3 h-3" strokeWidth={2} /> KYC
                      </span>
                    )}
                    {a.profiles?.verified_phone && (
                      <span className="inline-flex items-center gap-1 text-caption text-success">
                        <Phone className="w-3 h-3" strokeWidth={2} /> Telefon
                      </span>
                    )}
                    {a.profiles?.kanton && (
                      <span className="inline-flex items-center gap-1 text-caption text-quiet">
                        <MapPin className="w-3 h-3" strokeWidth={1.5} /> {a.profiles.kanton}
                      </span>
                    )}
                  </div>
                  {a.message && (
                    <p className="text-body-sm text-muted line-clamp-2 mb-2">{a.message}</p>
                  )}
                  <div className="flex items-center gap-3 flex-wrap">
                    <StatusPill status={a.status} />
                    {a.score !== null && <ScoreBadge score={a.score} />}
                    <span className="text-caption text-quiet">{formatDate(a.created_at)}</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-quiet flex-shrink-0 mt-1" strokeWidth={1.5} />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {open && <AnfrageDrawer anfrage={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function AnfrageDrawer({
  anfrage, onClose,
}: { anfrage: Anfrage; onClose: () => void }) {
  const [pending, startTransition] = useTransition();
  const [reason, setReason] = useState('');
  const [showDecline, setShowDecline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = (status: 'akzeptiert' | 'abgelehnt' | 'released' | 'nda_pending') => {
    startTransition(async () => {
      setError(null);
      const res = await setAnfrageStatus(anfrage.id, status, status === 'abgelehnt' ? reason : undefined);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onClose();
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden />
      <aside className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-paper border-l border-stone overflow-y-auto animate-fade-in shadow-lift">
        <div className="sticky top-0 z-10 bg-paper border-b border-stone px-6 py-4 flex items-center justify-between">
          <h2 className="font-serif text-head-sm text-navy">Anfrage-Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 -mr-1 rounded-soft hover:bg-stone/40 transition-colors"
            aria-label="Schliessen"
          >
            <XIcon className="w-5 h-5 text-quiet" strokeWidth={1.5} />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          <div>
            <Avatar name={anfrage.profiles?.full_name ?? 'Käufer'} size="lg" />
            <p className="text-body text-navy font-medium mt-3">{anfrage.profiles?.full_name ?? 'Anonymer Käufer'}</p>
            <p className="text-caption text-quiet mt-1">
              Account seit {anfrage.profiles?.created_at ? formatDate(anfrage.profiles.created_at) : '—'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {anfrage.profiles?.verified_kyc && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill bg-success/10 text-success text-caption font-medium">
                <ShieldCheck className="w-3 h-3" strokeWidth={2} /> KYC verifiziert
              </span>
            )}
            {anfrage.profiles?.verified_phone && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill bg-success/10 text-success text-caption font-medium">
                <Phone className="w-3 h-3" strokeWidth={2} /> Telefon verifiziert
              </span>
            )}
            {anfrage.profiles?.kanton && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill bg-stone text-muted text-caption">
                <MapPin className="w-3 h-3" strokeWidth={1.5} /> {anfrage.profiles.kanton}
              </span>
            )}
          </div>

          {anfrage.score !== null && (
            <div className="rounded-card bg-stone/30 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="overline text-bronze-ink">Käufer-Score</p>
                <p className="text-body font-mono text-navy font-medium">{anfrage.score} / 100</p>
              </div>
              <div className="h-2 rounded-pill bg-stone overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all',
                    anfrage.score >= 70 ? 'bg-success' :
                    anfrage.score >= 40 ? 'bg-warn' : 'bg-danger',
                  )}
                  style={{ width: `${anfrage.score}%` }}
                />
              </div>
            </div>
          )}

          <div>
            <p className="overline text-bronze-ink mb-2">Nachricht</p>
            <p className="text-body text-ink whitespace-pre-wrap leading-relaxed">
              {anfrage.message ?? '(Keine Nachricht)'}
            </p>
          </div>

          <div>
            <p className="overline text-bronze-ink mb-2">Aktueller Status</p>
            <StatusPill status={anfrage.status} />
            <p className="text-caption text-quiet mt-2">{formatDateLong(anfrage.created_at)}</p>
            {anfrage.decline_reason && (
              <p className="mt-3 text-caption text-danger">Abgelehnt: {anfrage.decline_reason}</p>
            )}
          </div>

          {error && (
            <div className="rounded-soft bg-danger/5 border border-danger/30 px-3 py-2 text-caption text-danger flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
              {error}
            </div>
          )}

          {/* Actions */}
          {showDecline ? (
            <div className="space-y-3">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Begründung (Pflicht — wird dem Käufer mitgeteilt)"
                rows={3}
                className="w-full px-4 py-3 bg-paper border border-stone rounded-soft text-body-sm focus:outline-none focus:border-bronze focus:shadow-focus resize-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handle('abgelehnt')}
                  disabled={pending || reason.trim().length < 10}
                  className="flex-1 px-4 py-2.5 bg-danger text-cream rounded-soft text-body-sm font-medium hover:bg-danger/90 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {pending ? 'Lehne ab …' : 'Ablehnen'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDecline(false)}
                  className="px-4 py-2.5 border border-stone text-quiet rounded-soft text-body-sm hover:bg-stone/30"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 pt-4 border-t border-stone">
              {anfrage.status === 'neu' && (
                <>
                  <button
                    type="button"
                    onClick={() => handle('akzeptiert')}
                    disabled={pending}
                    className="px-4 py-3 bg-success text-cream rounded-soft text-body-sm font-medium hover:bg-success/90 inline-flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" strokeWidth={2} />}
                    Akzeptieren — NDA freigeben
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDecline(true)}
                    className="px-4 py-3 border border-stone text-danger rounded-soft text-body-sm font-medium hover:bg-danger/5 inline-flex items-center justify-center gap-2"
                  >
                    <XIcon className="w-4 h-4" strokeWidth={2} /> Ablehnen
                  </button>
                </>
              )}
              {anfrage.status === 'nda_signed' && (
                <button
                  type="button"
                  onClick={() => handle('released')}
                  disabled={pending}
                  className="px-4 py-3 bg-bronze text-cream rounded-soft text-body-sm font-medium hover:bg-bronze-ink inline-flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" strokeWidth={2} />}
                  Datenraum freigeben
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'md' | 'lg' }) {
  const initials = name.split(' ').map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';
  return (
    <div className={cn(
      'rounded-full bg-navy text-cream flex items-center justify-center font-mono font-medium flex-shrink-0',
      size === 'lg' ? 'w-12 h-12 text-body' : 'w-9 h-9 text-caption',
    )}>
      {initials}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    neu: { label: 'Neu', cls: 'bg-bronze/15 text-bronze-ink' },
    in_pruefung: { label: 'In Prüfung', cls: 'bg-warn/15 text-warn' },
    akzeptiert: { label: 'Akzeptiert', cls: 'bg-success/15 text-success' },
    abgelehnt: { label: 'Abgelehnt', cls: 'bg-danger/15 text-danger' },
    nda_pending: { label: 'NDA ausstehend', cls: 'bg-warn/15 text-warn' },
    nda_signed: { label: 'NDA signiert', cls: 'bg-success/15 text-success' },
    released: { label: 'Datenraum offen', cls: 'bg-navy-soft text-navy' },
    geschlossen: { label: 'Geschlossen', cls: 'bg-stone text-quiet' },
  };
  const m = map[status] ?? map.neu;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-pill text-caption font-medium ${m.cls}`}>
      {m.label}
    </span>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const cls = score >= 70 ? 'bg-success/10 text-success' : score >= 40 ? 'bg-warn/10 text-warn' : 'bg-danger/10 text-danger';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-pill text-caption font-mono font-medium ${cls}`}>
      Score {score}
    </span>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / (24 * 60 * 60 * 1000));
  if (days === 0) return 'heute';
  if (days === 1) return 'gestern';
  if (days < 7) return `vor ${days} Tagen`;
  return d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString('de-CH', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
