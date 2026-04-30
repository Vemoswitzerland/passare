'use client';

import { useState, useTransition } from 'react';
import { FileText, FolderOpen, Lock, Crown, AlertCircle, Check, X } from 'lucide-react';
import { requestKaeuferDossier, grantDatenraumAccess, revokeDatenraumAccess } from './actions';
import { cn } from '@/lib/utils';

type Props = {
  anfrageId: string;
  isPro: boolean;
  dossierRequestedAt: string | null;
  datenraumGrantedAt: string | null;
  hasUploadedDossier: boolean;
};

/**
 * Pro-Action-Sidebar bei Anfrage-Detail.
 * Cyrill: «Verkäufer kann Käuferdossier anfragen + Datenraum freigeben.
 * Beides nur im Pro-Abo».
 *
 * - Käuferdossier-Anfrage (mit optionaler Begleit-Nachricht)
 * - Datenraum-Freigabe (Toggle: granted/revoked)
 * - Bei kein-Pro: Upgrade-Hinweis statt Buttons
 */
export function AnfrageProActions({
  anfrageId, isPro, dossierRequestedAt, datenraumGrantedAt, hasUploadedDossier,
}: Props) {
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [dossierMessage, setDossierMessage] = useState('');
  const [pending, startTx] = useTransition();
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const submitDossier = () => {
    setMsg(null);
    startTx(async () => {
      const res = await requestKaeuferDossier(anfrageId, dossierMessage);
      if (res.ok) {
        setMsg({ kind: 'ok', text: 'Anfrage geschickt — der Käufer hat eine Mail bekommen.' });
        setShowDossierModal(false);
        setDossierMessage('');
      } else {
        setMsg({ kind: 'err', text: res.error ?? 'Fehler.' });
      }
    });
  };

  const toggleDatenraum = () => {
    setMsg(null);
    const action = datenraumGrantedAt ? revokeDatenraumAccess : grantDatenraumAccess;
    startTx(async () => {
      const res = await action(anfrageId);
      if (res.ok) {
        setMsg({
          kind: 'ok',
          text: datenraumGrantedAt
            ? 'Datenraum-Zugang entzogen.'
            : 'Datenraum-Zugang freigegeben — der Käufer wurde benachrichtigt.',
        });
      } else {
        setMsg({ kind: 'err', text: res.error ?? 'Fehler.' });
      }
    });
  };

  return (
    <div className="bg-paper border border-stone rounded-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Crown className="w-4 h-4 text-bronze-ink" strokeWidth={1.5} />
        <p className="overline text-bronze-ink">Pro-Aktionen</p>
      </div>

      {!isPro ? (
        <div className="rounded-soft bg-bronze/5 border border-bronze/30 p-3">
          <Lock className="w-4 h-4 text-bronze-ink mb-2" strokeWidth={1.5} />
          <p className="text-body-sm text-navy font-medium mb-1">Pro oder Premium nötig</p>
          <p className="text-caption text-muted leading-snug mb-2">
            Käuferdossier anfordern und Datenraum-Freigabe gibt es ab Inserat-Pro.
          </p>
          <a
            href="/dashboard/verkaeufer/paket"
            className="text-caption font-medium text-bronze-ink hover:text-bronze inline-flex items-center gap-1"
          >
            Paket hochstufen →
          </a>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Käuferdossier */}
          {dossierRequestedAt ? (
            <div className={cn(
              'rounded-soft border p-3',
              hasUploadedDossier ? 'bg-success/5 border-success/30' : 'bg-stone/40 border-stone',
            )}>
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-quiet" strokeWidth={1.5} />
                <p className="text-caption font-medium text-navy">Käuferdossier</p>
              </div>
              <p className="text-caption text-quiet">
                {hasUploadedDossier
                  ? '✓ Dossier ist da — siehe links'
                  : 'Wartet auf Upload des Käufers'}
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowDossierModal(true)}
              disabled={pending}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-navy text-cream rounded-soft text-body-sm font-medium hover:bg-ink transition-colors disabled:opacity-60"
            >
              <FileText className="w-4 h-4" strokeWidth={1.5} />
              Käuferdossier anfordern
            </button>
          )}

          {/* Datenraum */}
          <button
            type="button"
            onClick={toggleDatenraum}
            disabled={pending}
            className={cn(
              'w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-soft text-body-sm font-medium transition-colors disabled:opacity-60',
              datenraumGrantedAt
                ? 'border border-success/30 bg-success/5 text-success hover:bg-success/10'
                : 'border border-stone bg-paper text-navy hover:border-bronze/40',
            )}
          >
            <FolderOpen className="w-4 h-4" strokeWidth={1.5} />
            {datenraumGrantedAt ? 'Datenraum-Zugang aktiv (entziehen)' : 'Datenraum freigeben'}
          </button>

          {msg && (
            <div className={cn(
              'flex items-start gap-1.5 px-2.5 py-2 rounded-soft text-caption',
              msg.kind === 'ok' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger',
            )}>
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" strokeWidth={2} />
              <span>{msg.text}</span>
            </div>
          )}

          <p className="text-caption text-quiet leading-snug pt-1">
            Du bleibst anonym — der Käufer sieht nichts ausser was du explizit teilst.
          </p>
        </div>
      )}

      {/* ── Modal: Dossier-Anfrage ─────────────────────────── */}
      {showDossierModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setShowDossierModal(false)}
        >
          <div
            className="bg-paper border border-stone rounded-card p-5 w-full max-w-md shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-serif text-head-sm text-navy font-medium">
                Käuferdossier anfordern
              </h4>
              <button
                type="button"
                onClick={() => setShowDossierModal(false)}
                className="p-1 -mr-1 rounded-soft hover:bg-stone/40 transition-colors"
              >
                <X className="w-4 h-4 text-quiet" strokeWidth={1.5} />
              </button>
            </div>

            <p className="text-caption text-muted mb-4">
              Der Käufer bekommt eine E-Mail mit der Bitte, sein Dossier hochzuladen.
              Du siehst es sobald es da ist — kannst dann entscheiden ob du den Chat öffnest.
            </p>

            <label className="block mb-3">
              <span className="text-caption text-quiet block mb-1.5">Optionale Begleit-Nachricht</span>
              <textarea
                value={dossierMessage}
                onChange={(e) => setDossierMessage(e.target.value)}
                rows={3}
                maxLength={4000}
                placeholder="z. B. «Bitte ein kurzes Profil mit Branchen-Erfahrung und Finanzierung»"
                className="w-full px-3 py-2 bg-cream border border-stone rounded-soft text-body-sm focus:outline-none focus:border-bronze resize-none"
              />
              <span className="text-caption text-quiet font-mono">{dossierMessage.length} / 4000</span>
            </label>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone">
              <button
                type="button"
                onClick={() => setShowDossierModal(false)}
                disabled={pending}
                className="px-3 py-1.5 text-caption text-quiet hover:text-navy transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={submitDossier}
                disabled={pending}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-bronze text-cream rounded-soft text-caption font-medium hover:bg-bronze-ink transition-colors disabled:opacity-60"
              >
                <Check className="w-3.5 h-3.5" strokeWidth={2} />
                {pending ? 'Sendet …' : 'Anfordern'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
