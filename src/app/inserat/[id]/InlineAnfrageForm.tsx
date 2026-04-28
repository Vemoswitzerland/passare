'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, Mail, MessageSquare, Send, Shield, X,
} from 'lucide-react';
import type { MockListing } from '@/lib/listings-mock';

/**
 * Inline-Anfrage-Formular im ContactPanel der Inserat-Detail-Seite.
 *
 * Cyrills Flow (2026-04-28):
 *   1. User füllt direkt im Kontakt-Panel rechts: Name, E-Mail, Nachricht
 *   2. Submit → Pop-up «Wir haben Ihnen eine Bestätigungs-Mail geschickt»
 *      mit Klick-Link «E-Mail verifizieren» (Mock — echte Mail kommt später).
 *   3. Klick auf Verifizieren → /anfrage/passwort?listing=…&email=…&name=…
 *   4. Dort Passwort setzen → Redirect zurück auf das Inserat.
 *
 * V1: Kein Backend angeschlossen. Etappe 2+ verdrahtet Resend für die Mail
 * und Supabase Auth für die Konto-Anlage.
 */

export function InlineAnfrageForm({ listing }: { listing: MockListing }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [nachricht, setNachricht] = useState('');
  const [busy, setBusy] = useState(false);
  const [popOpen, setPopOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await new Promise((r) => setTimeout(r, 600));
    setBusy(false);
    setPopOpen(true);
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
            value={nachricht}
            onChange={(e) => setNachricht(e.target.value)}
            placeholder="Was möchten Sie wissen? Zeithorizont, Finanzierung, Hintergrund …"
            rows={5}
            className="w-full bg-cream border border-stone rounded-soft px-3 py-2.5 text-body-sm placeholder:text-quiet focus:outline-none focus:border-bronze resize-none"
          />
        </Field>

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-navy text-cream rounded-soft px-6 py-3 text-body-sm font-medium hover:bg-ink hover:-translate-y-[1px] hover:shadow-lift transition-all duration-300 disabled:opacity-60 inline-flex items-center justify-center gap-2"
        >
          {busy ? <>Sende …</> : <><Send className="w-4 h-4" strokeWidth={1.5} /> Anfrage senden</>}
        </button>

        <p className="text-caption text-quiet leading-relaxed">
          Kein Konto nötig. Wir verifizieren nur Ihre E-Mail.
        </p>
      </form>

      <VerifyPopup
        open={popOpen}
        onClose={() => setPopOpen(false)}
        listing={listing}
        name={name}
        email={email}
        nachricht={nachricht}
      />
    </>
  );
}

/* ════════════════════════ Verify-Popup ════════════════════════ */
function VerifyPopup({
  open, onClose, listing, name, email, nachricht,
}: {
  open: boolean;
  onClose: () => void;
  listing: MockListing;
  name: string;
  email: string;
  nachricht: string;
}) {
  // ESC schliesst
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Body-Scroll sperren
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const verifyHref =
    `/anfrage/passwort?listing=${encodeURIComponent(listing.id)}` +
    `&email=${encodeURIComponent(email)}` +
    `&name=${encodeURIComponent(name)}` +
    `&msg=${encodeURIComponent(nachricht.slice(0, 200))}`;

  return (
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
                Bestätigungs-Mail gesendet<span className="text-bronze">.</span>
              </h3>
              <p className="text-body-sm text-muted leading-relaxed mb-2">
                Wir haben einen Verifizierungs-Link an
              </p>
              <p className="font-mono text-body-sm text-navy mb-4 break-all">{email}</p>
              <p className="text-caption text-quiet leading-relaxed mb-6">
                geschickt. Bitte öffnen Sie Ihr Postfach und klicken Sie auf
                «E-Mail verifizieren» — danach geht die Anfrage raus und Ihr
                Käufer-Basic-Konto ist sofort aktiv.
              </p>

              <a
                href={verifyHref}
                className="block w-full bg-navy text-cream rounded-soft px-6 py-3 text-body-sm font-medium hover:bg-ink transition-colors inline-flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
                Demo: Verifizierungs-Link öffnen
              </a>
              <p className="text-caption text-quiet mt-3 leading-relaxed">
                <Shield className="inline w-3 h-3 mr-1 text-bronze" strokeWidth={1.5} />
                In der Live-Version klicken Sie nur auf den Link in der Mail.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
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
