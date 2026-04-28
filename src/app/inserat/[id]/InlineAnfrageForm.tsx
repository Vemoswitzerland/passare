'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle, CheckCircle2, Mail, MessageSquare, Send, X,
} from 'lucide-react';
import type { MockListing } from '@/lib/listings-mock';

/**
 * Inline-Anfrage-Formular im ContactPanel der Inserat-Detail-Seite.
 *
 * Echter Flow (kein Demo):
 *   1. User füllt Name, E-Mail, Nachricht
 *   2. POST /api/anfrage → Server signiert Token, schickt Mail via Resend
 *   3. Mittiges Pop-up: «Bestätigungs-Mail geschickt — bitte Postfach prüfen»
 *   4. User klickt im Mail auf den Link → /anfrage/passwort?token=…
 *   5. Dort Passwort setzen → Käufer-Basic-Konto aktiv → Redirect aufs Inserat
 */

export function InlineAnfrageForm({ listing }: { listing: MockListing }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [nachricht, setNachricht] = useState('');
  const [busy, setBusy] = useState(false);
  const [popOpen, setPopOpen] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFehler(null);
    setBusy(true);
    try {
      const res = await fetch('/api/anfrage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          nachricht: nachricht.trim(),
          listing_id: listing.id,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? 'Anfrage konnte nicht gesendet werden.');
      }
      setPopOpen(true);
    } catch (err) {
      setFehler(err instanceof Error ? err.message : 'Anfrage konnte nicht gesendet werden.');
    } finally {
      setBusy(false);
    }
  }

  async function resendMail() {
    setFehler(null);
    setBusy(true);
    try {
      const res = await fetch('/api/anfrage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          nachricht: nachricht.trim(),
          listing_id: listing.id,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? 'Erneuter Versand fehlgeschlagen.');
      }
    } catch (err) {
      setFehler(err instanceof Error ? err.message : 'Erneuter Versand fehlgeschlagen.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Name" required>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Vor- und Nachname"
            className="w-full bg-cream border border-stone rounded-soft px-3 py-2.5 text-body-sm placeholder:text-quiet focus:outline-none focus:border-bronze"
          />
        </Field>

        <Field label="E-Mail" required>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ihre@firma.ch"
            className="w-full bg-cream border border-stone rounded-soft px-3 py-2.5 text-body-sm placeholder:text-quiet focus:outline-none focus:border-bronze"
          />
        </Field>

        <Field label="Ihre Nachricht" required>
          <textarea
            required
            minLength={5}
            value={nachricht}
            onChange={(e) => setNachricht(e.target.value)}
            placeholder="Was möchten Sie wissen? Zeithorizont, Finanzierung, Hintergrund …"
            rows={5}
            className="w-full bg-cream border border-stone rounded-soft px-3 py-2.5 text-body-sm placeholder:text-quiet focus:outline-none focus:border-bronze resize-none"
          />
        </Field>

        {fehler && (
          <p className="text-caption text-bronze-ink bg-bronze/10 rounded-soft px-3 py-2 flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
            {fehler}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-navy text-cream rounded-soft px-6 py-3 text-body-sm font-medium hover:bg-ink hover:-translate-y-[1px] hover:shadow-lift transition-all duration-300 disabled:opacity-60 inline-flex items-center justify-center gap-2"
        >
          {busy ? <>Sende …</> : <><Send className="w-4 h-4" strokeWidth={1.5} /> Anfrage senden</>}
        </button>
      </form>

      <VerifyPopup
        open={popOpen}
        onClose={() => setPopOpen(false)}
        email={email}
        busy={busy}
        onResend={resendMail}
        fehler={fehler}
      />
    </>
  );
}

/* ════════════════════════ Verify-Popup (mittig auf Display via Portal) ════════════════════════ */
function VerifyPopup({
  open, onClose, email, busy, onResend, fehler,
}: {
  open: boolean;
  onClose: () => void;
  email: string;
  busy: boolean;
  onResend: () => void;
  fehler: string | null;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Wichtig: via Portal auf document.body rendern, sonst hängt das `position: fixed`
  // an einem transform-Parent (motion.div / Reveal) und wird unten-rechts gerendert.
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="verify-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-ink/50 backdrop-blur-sm"
          />
          <motion.div
            key="verify-popup"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="verify-titel"
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[92vw] max-w-md bg-cream rounded-card shadow-2xl flex flex-col overflow-hidden"
          >
            <header className="flex items-center justify-between px-6 py-4 border-b border-stone bg-paper">
              <div className="flex items-center gap-2 min-w-0">
                <MessageSquare className="w-4 h-4 text-bronze flex-shrink-0" strokeWidth={1.5} />
                <h2
                  id="verify-titel"
                  className="font-mono text-[11px] uppercase tracking-widest text-navy truncate"
                >
                  E-Mail prüfen
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Schliessen"
                className="p-1.5 rounded-soft text-muted hover:text-ink hover:bg-stone/50 transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </header>

            <div className="px-6 py-7 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-bronze/15 text-bronze-ink flex items-center justify-center mb-5">
                <Mail className="w-7 h-7" strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-head-md text-navy font-normal mb-3">
                Bestätigungs-Mail geschickt<span className="text-bronze">.</span>
              </h3>
              <p className="text-body-sm text-muted leading-relaxed mb-1">
                Wir haben einen Verifizierungs-Link an
              </p>
              <p className="font-mono text-body-sm text-navy mb-5 break-all">{email}</p>
              <p className="text-caption text-quiet leading-relaxed mb-6">
                gesendet. Bitte öffnen Sie Ihr Postfach und klicken Sie auf
                «E-Mail bestätigen» — danach geht die Anfrage an den Verkäufer und
                Ihr Käufer-Basic-Konto wird aktiviert.
              </p>

              {fehler && (
                <p className="text-caption text-bronze-ink bg-bronze/10 rounded-soft px-3 py-2 mb-3 text-left">
                  <AlertCircle className="inline w-3 h-3 mr-1" strokeWidth={1.5} />
                  {fehler}
                </p>
              )}

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full bg-navy text-cream rounded-soft px-6 py-3 text-body-sm font-medium hover:bg-ink transition-colors inline-flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
                  Verstanden — Postfach prüfen
                </button>
                <button
                  type="button"
                  onClick={onResend}
                  disabled={busy}
                  className="w-full bg-transparent text-quiet border border-stone rounded-soft px-6 py-2.5 text-caption font-medium hover:border-bronze hover:text-bronze transition-colors disabled:opacity-60"
                >
                  {busy ? 'Sende erneut …' : 'Mail nicht angekommen? Erneut senden'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ════════════════════════ Field-Wrapper ════════════════════════ */
function Field({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-widest text-quiet block mb-1.5">
        {label}{required && <span className="text-bronze ml-1">*</span>}
      </span>
      {children}
    </label>
  );
}
