'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, LogIn, UserPlus, X } from 'lucide-react';
import { OAuthButtons, AuthDivider } from '@/components/ui/oauth-buttons';

/**
 * Mittiges Login-Required-Dialog.
 *
 * Wird vom Merken-Button (CardActions, LikeShareActions) geöffnet, wenn der
 * User nicht eingeloggt ist. Bietet OAuth (Google/LinkedIn) als Schnell-Weg
 * sowie Standard-Login/Register mit `next=`-Redirect zurück auf die aktuelle URL.
 *
 * Portal-Render auf document.body, damit kein transform-Vorfahre die fixed-
 * Positionierung bricht.
 */

type Props = {
  open: boolean;
  onClose: () => void;
  /** Was der User wollte (z.B. «Inserat merken»). Bestimmt Headline-Text. */
  intent?: 'merken' | 'allgemein';
};

export function LoginRequiredDialog({ open, onClose, intent = 'merken' }: Props) {
  const [mounted, setMounted] = useState(false);
  const [returnTo, setReturnTo] = useState('/');

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      setReturnTo(window.location.pathname + window.location.search);
    }
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

  if (!mounted) return null;

  const headline =
    intent === 'merken'
      ? 'Inserat merken'
      : 'Anmeldung erforderlich';
  const tagline =
    intent === 'merken'
      ? 'Damit Sie Ihre gemerkten Inserate auf jedem Gerät wiederfinden, brauchen Sie ein Konto. Käufer-Basic ist kostenlos.'
      : 'Sie brauchen ein Konto, um diese Aktion auszuführen. Käufer-Basic ist kostenlos.';

  const loginHref = `/auth/login?next=${encodeURIComponent(returnTo)}`;
  const registerHref = `/auth/register?role=kaeufer&next=${encodeURIComponent(returnTo)}`;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="login-required-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-ink/50 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
            <motion.div
              key="login-required-dialog"
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="login-required-titel"
              className="pointer-events-auto w-full max-w-md bg-cream rounded-card shadow-2xl flex flex-col overflow-hidden"
            >
              <header className="flex items-center justify-between px-6 py-4 border-b border-stone bg-paper">
                <div className="flex items-center gap-2 min-w-0">
                  <Heart className="w-4 h-4 text-bronze flex-shrink-0" strokeWidth={1.5} />
                  <h2
                    id="login-required-titel"
                    className="font-mono text-[11px] uppercase tracking-widest text-navy truncate"
                  >
                    {intent === 'merken' ? 'Merken' : 'Anmeldung'}
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
                <div className="w-14 h-14 mx-auto rounded-full bg-bronze/15 text-bronze-ink flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <h3 className="font-serif text-head-md text-navy font-normal mb-3">
                  {headline}<span className="text-bronze">.</span>
                </h3>
                <p className="text-body-sm text-muted leading-relaxed mb-6">
                  {tagline}
                </p>
              </div>

              <div className="px-6 pb-6 space-y-4">
                <OAuthButtons mode="register" />
                <AuthDivider>oder</AuthDivider>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href={loginHref}
                    className="inline-flex items-center justify-center gap-2 bg-transparent text-navy border border-stone rounded-soft px-4 py-2.5 text-body-sm font-medium hover:border-navy transition-colors"
                  >
                    <LogIn className="w-4 h-4" strokeWidth={1.5} />
                    Anmelden
                  </Link>
                  <Link
                    href={registerHref}
                    className="inline-flex items-center justify-center gap-2 bg-navy text-cream rounded-soft px-4 py-2.5 text-body-sm font-medium hover:bg-ink transition-colors"
                  >
                    <UserPlus className="w-4 h-4" strokeWidth={1.5} />
                    Registrieren
                  </Link>
                </div>
                <p className="text-caption text-quiet leading-relaxed text-center">
                  Käufer-Basic ist und bleibt gratis.
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
