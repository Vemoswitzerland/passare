'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, Lock, Mail, MessageSquare, Send, Shield, X,
} from 'lucide-react';
import type { MockListing } from '@/lib/listings-mock';

/**
 * Anfrage-Drawer — kein Konto nötig.
 *
 * Cyrills Flow (2026-04-28):
 *   1. Anfrage-Form (Name, E-Mail, Nachricht, Telefon optional)
 *   2. E-Mail-Verifikation (Klick auf «E-Mail verifizieren», Mock-Bestätigung)
 *   3. Passwort setzen → Gratis-Käufer-Konto wird aktiviert
 *   4. Bestätigung: Anfrage versendet + Konto aktiv
 *
 * V1: Nur Frontend-State (kein Backend angeschlossen). Etappe 2+ verdrahtet
 * Resend für die Verifikations-Mail und Supabase Auth für Konto-Anlage.
 */

type Step = 'form' | 'verify' | 'password' | 'done';

type Props = {
  listing: MockListing;
  open: boolean;
  onClose: () => void;
};

export function AnfrageDrawer({ listing, open, onClose }: Props) {
  const [step, setStep] = useState<Step>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [telefon, setTelefon] = useState('');
  const [nachricht, setNachricht] = useState('');
  const [passwort, setPasswort] = useState('');
  const [passwortRepeat, setPasswortRepeat] = useState('');
  const [busy, setBusy] = useState(false);
  const [pwFehler, setPwFehler] = useState<string | null>(null);

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

  // Reset wenn Drawer geschlossen wird
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setStep('form');
        setName('');
        setEmail('');
        setTelefon('');
        setNachricht('');
        setPasswort('');
        setPasswortRepeat('');
        setPwFehler(null);
        setBusy(false);
      }, 350);
      return () => clearTimeout(t);
    }
  }, [open]);

  const stepIndex = useMemo(() => {
    const order: Step[] = ['form', 'verify', 'password', 'done'];
    return order.indexOf(step);
  }, [step]);

  async function handleSendForm(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await new Promise((r) => setTimeout(r, 600));
    setBusy(false);
    setStep('verify');
  }

  async function handleVerifyEmail() {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 700));
    setBusy(false);
    setStep('password');
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setPwFehler(null);
    if (passwort.length < 8) {
      setPwFehler('Mindestens 8 Zeichen.');
      return;
    }
    if (passwort !== passwortRepeat) {
      setPwFehler('Passwörter stimmen nicht überein.');
      return;
    }
    setBusy(true);
    await new Promise((r) => setTimeout(r, 800));
    setBusy(false);
    setStep('done');
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="anfrage-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm"
          />

          <motion.aside
            key="anfrage-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 h-full w-full sm:w-[460px] z-50 bg-cream shadow-2xl flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="anfrage-titel"
          >
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-5 border-b border-stone bg-paper">
              <div className="flex items-center gap-2 min-w-0">
                <MessageSquare className="w-4 h-4 text-bronze flex-shrink-0" strokeWidth={1.5} />
                <h2
                  id="anfrage-titel"
                  className="font-mono text-[11px] uppercase tracking-widest text-navy truncate"
                >
                  {step === 'done' ? 'Anfrage gesendet' : 'Anfrage senden'}
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

            {/* Step-Indicator */}
            <StepIndicator current={stepIndex} />

            {/* Inserat-Snippet */}
            <div className="px-6 py-4 border-b border-stone bg-paper">
              <p className="font-mono text-[10px] uppercase tracking-widest text-bronze-ink mb-1">
                {listing.id}
              </p>
              <p className="font-serif text-body-lg text-navy leading-tight">
                {listing.titel}
              </p>
              <p className="font-mono text-caption text-quiet mt-1">
                {listing.branche} · Kanton {listing.kanton} · {listing.umsatz} Umsatz
              </p>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {step === 'form' && (
                <FormStep
                  name={name} setName={setName}
                  email={email} setEmail={setEmail}
                  telefon={telefon} setTelefon={setTelefon}
                  nachricht={nachricht} setNachricht={setNachricht}
                  busy={busy}
                  onSubmit={handleSendForm}
                />
              )}
              {step === 'verify' && (
                <VerifyStep
                  email={email}
                  busy={busy}
                  onVerify={handleVerifyEmail}
                  onBack={() => setStep('form')}
                />
              )}
              {step === 'password' && (
                <PasswordStep
                  email={email}
                  passwort={passwort} setPasswort={setPasswort}
                  passwortRepeat={passwortRepeat} setPasswortRepeat={setPasswortRepeat}
                  fehler={pwFehler}
                  busy={busy}
                  onSubmit={handleSetPassword}
                />
              )}
              {step === 'done' && (
                <DoneStep listing={listing} email={email} onClose={onClose} />
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* ════════════════════════ Step Indicator ════════════════════════ */
function StepIndicator({ current }: { current: number }) {
  const labels = ['Anfrage', 'Mail', 'Konto', 'Fertig'];
  return (
    <div className="px-6 py-3 border-b border-stone bg-cream">
      <div className="flex items-center gap-2">
        {labels.map((label, i) => (
          <div key={label} className="flex items-center flex-1">
            <div className="flex items-center gap-2 flex-1">
              <span
                className={`w-5 h-5 rounded-full text-[10px] font-mono font-medium flex items-center justify-center transition-colors ${
                  i < current
                    ? 'bg-bronze text-cream'
                    : i === current
                    ? 'bg-navy text-cream'
                    : 'bg-stone text-quiet'
                }`}
              >
                {i < current ? '✓' : i + 1}
              </span>
              <span
                className={`font-mono text-[10px] uppercase tracking-widest hidden sm:inline ${
                  i === current ? 'text-navy' : 'text-quiet'
                }`}
              >
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div className={`h-px flex-1 mx-1 ${i < current ? 'bg-bronze' : 'bg-stone'}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════ Step 1: Form ════════════════════════ */
function FormStep({
  name, setName, email, setEmail, telefon, setTelefon,
  nachricht, setNachricht, busy, onSubmit,
}: {
  name: string; setName: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  telefon: string; setTelefon: (v: string) => void;
  nachricht: string; setNachricht: (v: string) => void;
  busy: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-body-sm text-muted leading-relaxed">
        Senden Sie dem Verkäufer Ihre Anfrage. Sie brauchen noch kein Konto —
        wir verifizieren nur Ihre E-Mail-Adresse.
      </p>

      <Field label="Name" required>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Vor- und Nachname"
          className="w-full bg-paper border border-stone rounded-soft px-3 py-2.5 text-body-sm placeholder:text-quiet focus:outline-none focus:border-bronze"
        />
      </Field>

      <Field label="E-Mail" required>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ihre@firma.ch"
          className="w-full bg-paper border border-stone rounded-soft px-3 py-2.5 text-body-sm placeholder:text-quiet focus:outline-none focus:border-bronze"
        />
      </Field>

      <Field label="Telefon (optional)">
        <input
          type="tel"
          value={telefon}
          onChange={(e) => setTelefon(e.target.value)}
          placeholder="+41 …"
          className="w-full bg-paper border border-stone rounded-soft px-3 py-2.5 text-body-sm placeholder:text-quiet focus:outline-none focus:border-bronze"
        />
      </Field>

      <Field label="Ihre Nachricht" required>
        <textarea
          required
          value={nachricht}
          onChange={(e) => setNachricht(e.target.value)}
          placeholder="Was möchten Sie wissen? Hintergrund zu Ihnen, Zeithorizont, Finanzierung …"
          rows={6}
          className="w-full bg-paper border border-stone rounded-soft px-3 py-2.5 text-body-sm placeholder:text-quiet focus:outline-none focus:border-bronze resize-none"
        />
      </Field>

      <div className="bg-bronze/5 border border-bronze/20 rounded-soft px-4 py-3 flex items-start gap-3">
        <Shield className="w-4 h-4 text-bronze flex-shrink-0 mt-0.5" strokeWidth={1.5} />
        <p className="text-caption text-muted leading-relaxed">
          Im nächsten Schritt verifizieren wir Ihre E-Mail-Adresse — danach geht
          die Anfrage direkt an den Verkäufer.
        </p>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="w-full bg-navy text-cream rounded-soft px-6 py-3 text-body-sm font-medium hover:bg-ink transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
      >
        {busy ? <>Sende …</> : <><Send className="w-4 h-4" strokeWidth={1.5} /> Weiter zur E-Mail-Bestätigung</>}
      </button>
    </form>
  );
}

/* ════════════════════════ Step 2: Verify ════════════════════════ */
function VerifyStep({
  email, busy, onVerify, onBack,
}: { email: string; busy: boolean; onVerify: () => void; onBack: () => void }) {
  return (
    <div className="text-center pt-6">
      <div className="w-16 h-16 mx-auto rounded-full bg-bronze/15 text-bronze-ink flex items-center justify-center mb-5">
        <Mail className="w-7 h-7" strokeWidth={1.5} />
      </div>
      <h3 className="font-serif text-head-md text-navy font-normal mb-3">
        E-Mail bestätigen<span className="text-bronze">.</span>
      </h3>
      <p className="text-body-sm text-muted leading-relaxed max-w-sm mx-auto mb-2">
        Wir haben eine Bestätigungs-Mail an
      </p>
      <p className="font-mono text-body-sm text-navy mb-5 break-all">{email}</p>
      <p className="text-caption text-quiet leading-relaxed max-w-xs mx-auto mb-6">
        gesendet. Bitte klicken Sie auf den Bestätigungs-Link in der Mail oder
        unten auf den Knopf, um direkt fortzufahren.
      </p>

      <button
        type="button"
        onClick={onVerify}
        disabled={busy}
        className="w-full bg-navy text-cream rounded-soft px-6 py-3 text-body-sm font-medium hover:bg-ink transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
      >
        {busy ? <>Verifiziere …</> : <><CheckCircle2 className="w-4 h-4" strokeWidth={1.5} /> E-Mail verifizieren</>}
      </button>
      <button
        type="button"
        onClick={onBack}
        className="mt-3 font-mono text-[11px] uppercase tracking-widest text-quiet hover:text-navy transition-colors"
      >
        E-Mail anpassen
      </button>
    </div>
  );
}

/* ════════════════════════ Step 3: Passwort ════════════════════════ */
function PasswordStep({
  email, passwort, setPasswort, passwortRepeat, setPasswortRepeat,
  fehler, busy, onSubmit,
}: {
  email: string;
  passwort: string; setPasswort: (v: string) => void;
  passwortRepeat: string; setPasswortRepeat: (v: string) => void;
  fehler: string | null;
  busy: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="text-center mb-2">
        <div className="w-14 h-14 mx-auto rounded-full bg-success/10 text-success flex items-center justify-center mb-3">
          <CheckCircle2 className="w-6 h-6" strokeWidth={1.5} />
        </div>
        <p className="text-body-sm text-success mb-1">E-Mail bestätigt</p>
        <p className="font-mono text-caption text-quiet break-all">{email}</p>
      </div>

      <div className="bg-paper border border-stone rounded-soft px-4 py-3">
        <h3 className="font-serif text-body-lg text-navy leading-tight mb-1">
          Konto kostenlos aktivieren
        </h3>
        <p className="text-caption text-muted leading-relaxed">
          Vergeben Sie ein Passwort — dann ist Ihr Käufer-Basic-Konto sofort aktiv
          (gratis, ohne Verpflichtung).
        </p>
      </div>

      <Field label="Passwort" required>
        <input
          type="password"
          required
          minLength={8}
          value={passwort}
          onChange={(e) => setPasswort(e.target.value)}
          placeholder="Mindestens 8 Zeichen"
          className="w-full bg-paper border border-stone rounded-soft px-3 py-2.5 text-body-sm placeholder:text-quiet focus:outline-none focus:border-bronze"
        />
      </Field>

      <Field label="Passwort wiederholen" required>
        <input
          type="password"
          required
          minLength={8}
          value={passwortRepeat}
          onChange={(e) => setPasswortRepeat(e.target.value)}
          placeholder="Mindestens 8 Zeichen"
          className="w-full bg-paper border border-stone rounded-soft px-3 py-2.5 text-body-sm placeholder:text-quiet focus:outline-none focus:border-bronze"
        />
      </Field>

      {fehler && (
        <p className="text-caption text-bronze-ink bg-bronze/10 rounded-soft px-3 py-2">
          {fehler}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full bg-navy text-cream rounded-soft px-6 py-3 text-body-sm font-medium hover:bg-ink transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
      >
        {busy ? <>Aktiviere Konto …</> : <><Lock className="w-4 h-4" strokeWidth={1.5} /> Konto aktivieren &amp; Anfrage senden</>}
      </button>

      <p className="text-caption text-quiet text-center leading-relaxed">
        Mit der Aktivierung akzeptieren Sie unsere AGB.
        Käufer-Basic ist und bleibt gratis.
      </p>
    </form>
  );
}

/* ════════════════════════ Step 4: Done ════════════════════════ */
function DoneStep({
  listing, email, onClose,
}: { listing: MockListing; email: string; onClose: () => void }) {
  return (
    <div className="flex flex-col items-center text-center pt-8">
      <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center mb-5">
        <CheckCircle2 className="w-8 h-8" strokeWidth={1.5} />
      </div>
      <h3 className="font-serif text-head-md text-navy font-normal mb-3">
        Anfrage gesendet<span className="text-bronze">.</span>
      </h3>
      <p className="text-body-sm text-muted leading-relaxed max-w-xs mb-2">
        Der Verkäufer von <span className="text-navy">{listing.titel}</span> wurde
        informiert.
      </p>
      <p className="text-caption text-quiet leading-relaxed max-w-xs mb-6">
        Antwort kommt an <span className="text-navy font-mono">{email}</span> —
        in der Regel innerhalb von 24–48 Stunden.
      </p>

      <div className="bg-bronze/5 border border-bronze/20 rounded-soft px-4 py-3 mb-6 max-w-sm">
        <p className="font-mono text-[10px] uppercase tracking-widest text-bronze-ink mb-1">
          Käufer-Basic aktiv
        </p>
        <p className="text-caption text-muted leading-relaxed">
          Sie können sich jederzeit unter
          <span className="font-mono text-navy"> /auth/login </span>
          mit Ihrer E-Mail einloggen — Favoriten, Suchprofile und Anfragen
          werden Ihrem Konto zugeordnet.
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="w-full max-w-sm bg-navy text-cream rounded-soft px-6 py-3 text-body-sm font-medium hover:bg-ink transition-colors"
      >
        Schliessen
      </button>
    </div>
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
