'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Mock-Live-Ticker: Plattform-Aktivität in Mono-Typo.
 * Tech-affin wie Linear/Stripe-Status, aber passare-Design-Sprache.
 */

type Event = {
  type: 'listing' | 'nda' | 'inquiry' | 'deal';
  actor: string;
  target: string;
  meta: string;
  time: string;
};

const EVENTS: Event[] = [
  { type: 'listing', actor: 'Verkäufer', target: 'Maschinenbau ZH', meta: 'CHF 6–8 Mio', time: 'Vor 12 Min' },
  { type: 'nda',     actor: 'Käufer',    target: 'Präzisions-Dreherei BE', meta: 'NDA signiert', time: 'Vor 28 Min' },
  { type: 'inquiry', actor: 'MBI',       target: 'IT-Dienstleister ZG', meta: 'Erstkontakt',   time: 'Vor 41 Min' },
  { type: 'listing', actor: 'Broker',    target: 'Treuhand-Kanzlei VD',  meta: 'Mandat live',  time: 'Vor 1 Std' },
  { type: 'deal',    actor: 'Übergabe',  target: 'Elektrotechnik AG',    meta: 'Closing Q3',   time: 'Vor 2 Std' },
  { type: 'inquiry', actor: 'Family Office', target: 'Logistik SG',      meta: 'Dossier angefragt', time: 'Vor 3 Std' },
];

const LABELS = {
  listing: { label: 'neues mandat', dotClass: 'bg-bronze' },
  nda:     { label: 'nda ausgeführt', dotClass: 'bg-success' },
  inquiry: { label: 'anfrage', dotClass: 'bg-navy' },
  deal:    { label: 'abschluss',     dotClass: 'bg-bronze' },
} as const;

export function LiveTicker() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % EVENTS.length), 3800);
    return () => clearInterval(id);
  }, []);

  const e = EVENTS[idx];
  const label = LABELS[e.type];

  return (
    <div className="relative border border-stone rounded-card bg-paper overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-stone bg-cream/50">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success/60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
          </span>
          <span className="font-mono text-[11px] tracking-wider uppercase text-muted">
            plattform · live
          </span>
        </div>
        <span className="font-mono text-[11px] text-quiet">v1.0.0-beta</span>
      </div>

      {/* Event */}
      <div className="p-6 min-h-[112px] flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full flex items-center gap-4"
          >
            <span className={`flex-shrink-0 w-2.5 h-2.5 rounded-full ${label.dotClass}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="font-mono text-[11px] tracking-wider uppercase text-muted">
                  {label.label}
                </span>
                <span className="font-mono text-[11px] text-quiet">›</span>
                <span className="font-mono text-[11px] text-quiet">{e.actor}</span>
              </div>
              <p className="font-serif text-head-sm text-navy mt-1.5 truncate">{e.target}</p>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="font-mono text-caption text-navy font-tabular">{e.meta}</p>
              <p className="font-mono text-[11px] text-quiet mt-1">{e.time}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer — Progress-Dots */}
      <div className="flex gap-1.5 px-6 pb-5">
        {EVENTS.map((_, i) => (
          <span
            key={i}
            className={`h-0.5 flex-1 rounded-full transition-all duration-500 ${
              i === idx ? 'bg-navy' : 'bg-stone'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
