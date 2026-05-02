'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Vorschau-Button für das Käufer-Profil.
 *
 * Cyrill: «oben einen Knopf, wo man sehen kann, was Verkäufer sehen.
 * Da kann man das anklicken und dann sieht man, dass alles sauber.»
 *
 * Öffnet ein Modal mit dem Profil-Preview-Content. Inhalt kommt als
 * children-Prop (= ProfilPreview-Komponente).
 */
export function ProfilVorschauButton({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  if (typeof window !== 'undefined' && !mounted) {
    setMounted(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-navy text-cream rounded-soft text-caption font-medium hover:bg-ink transition-colors"
      >
        <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
        Vorschau anzeigen
      </button>

      {mounted && createPortal(
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-40 bg-ink/60 backdrop-blur-sm"
              />
              <div className="fixed inset-0 z-50 flex items-start justify-center pointer-events-none p-4 md:p-8 overflow-y-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.96 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="vorschau-titel"
                  className="pointer-events-auto w-full max-w-2xl bg-cream rounded-card shadow-2xl flex flex-col my-auto"
                >
                  <header className="flex items-center justify-between px-6 py-4 border-b border-stone bg-paper rounded-t-card">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-bronze" strokeWidth={1.5} />
                      <h2
                        id="vorschau-titel"
                        className="font-mono text-[11px] uppercase tracking-widest text-navy"
                      >
                        Vorschau · So sehen Verkäufer dein Profil
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      aria-label="Schliessen"
                      className="p-1.5 rounded-soft text-muted hover:text-ink hover:bg-stone/50 transition-colors"
                    >
                      <X className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </header>
                  <div className="p-5 md:p-7">
                    {children}
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
