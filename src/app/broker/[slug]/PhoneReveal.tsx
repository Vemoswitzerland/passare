'use client';

import { useState } from 'react';
import { Phone } from 'lucide-react';

/**
 * Anti-Scraping-Telefon-Anzeige für Public-Broker-Profile.
 *
 * - Vor dem Klick: Nummer ist mit blur(3px) und user-select:none gerendert
 *   → Bots, die die HTML-Source greifen, sehen die Nummer zwar im DOM,
 *     aber Drag-Copy ist deaktiviert und der Optical-Scrape-Bot bekommt
 *     keinen sauberen Wert.
 * - Nach Klick: tel:-Link öffnet sich, Nummer wird klar.
 *
 * Pragmatischer Schutz, keine harte Wand. Reicht für 95 % der KMU-Scraper.
 */
export function PhoneReveal({ phone }: { phone: string }) {
  const [revealed, setRevealed] = useState(false);

  if (revealed) {
    return (
      <a
        href={`tel:${phone}`}
        className="inline-flex items-center gap-1.5 text-body-sm text-bronze-ink hover:text-navy transition-colors"
      >
        <Phone className="w-4 h-4" strokeWidth={1.5} />
        {phone}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setRevealed(true)}
      className="inline-flex items-center gap-1.5 text-body-sm text-bronze-ink hover:text-navy transition-colors group"
      aria-label="Telefonnummer anzeigen"
    >
      <Phone className="w-4 h-4" strokeWidth={1.5} />
      <span
        aria-hidden="true"
        style={{ filter: 'blur(3px)', userSelect: 'none' }}
        className="font-mono"
      >
        {phone}
      </span>
      <span className="text-caption text-quiet group-hover:text-navy transition-colors">
        · Anzeigen
      </span>
    </button>
  );
}
