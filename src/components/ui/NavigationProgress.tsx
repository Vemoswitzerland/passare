'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Globale Top-Loading-Bar — gibt sofortiges visuelles Feedback bei Navigation.
 *
 * Pattern (battle-tested wie GitHub/Vercel/Stripe):
 *   1. Listen auf alle <a>-Klicks im document
 *   2. Bei Klick auf interner Link → Bar einblenden + Pseudo-Progress (0→90 %)
 *   3. Bei pathname/searchParams-Change → Bar auf 100 % füllen + ausblenden
 *
 * Warum so: `usePathname` ändert sich erst NACH der Navigation. Wir brauchen
 * aber schon BEIM KLICK Feedback — sonst wirkt die Plattform träge bei
 * langsamen Pages. Der Click-Listener fängt genau diesen Moment.
 *
 * Visuell: 2 px hohe Bronze-Bar ganz oben, glühender Schweif rechts, läuft
 * pseudo-progressiv. Kein JS-Spinner-Flickern.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState<number | null>(null);
  const timersRef = useRef<{ tick?: ReturnType<typeof setInterval>; finish?: ReturnType<typeof setTimeout> }>({});

  const start = () => {
    // Reset timers
    if (timersRef.current.tick) clearInterval(timersRef.current.tick);
    if (timersRef.current.finish) clearTimeout(timersRef.current.finish);

    setProgress(8);
    // Pseudo-Progress: bewegt sich asymptotisch auf 90 % zu, nie schneller als
    // tatsächliche Antwortzeit. Nutzer sieht permanent Bewegung.
    timersRef.current.tick = setInterval(() => {
      setProgress((p) => {
        if (p === null) return null;
        // Annäherung an 90 % — exponentiell langsamer
        const next = p + (90 - p) * 0.08;
        return Math.min(next, 90);
      });
    }, 200);
  };

  const done = () => {
    if (timersRef.current.tick) clearInterval(timersRef.current.tick);
    setProgress(100);
    timersRef.current.finish = setTimeout(() => setProgress(null), 220);
  };

  // Click-Listener: triggert start() bei jedem Link auf interne Routes
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Modifier-Keys ignorieren (Cmd-Click öffnet neuen Tab, kein Progress nötig)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (e.button !== 0) return; // nur Linksklick

      const link = (e.target as HTMLElement)?.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;

      // Externe URLs, Anchor-Links, mailto:/tel:/javascript: → kein Progress
      if (
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('//') ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('javascript:')
      ) {
        return;
      }

      // target="_blank" auch ignorieren
      if (link.target === '_blank') return;

      // gleiche URL → kein Loading nötig
      const url = new URL(href, window.location.origin);
      if (url.pathname === window.location.pathname && url.search === window.location.search) {
        return;
      }

      start();
    };

    // Form-Submits (Server-Actions) auch tracken
    const handleSubmit = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement;
      // form mit method="dialog" oder e.defaultPrevented ignorieren
      if (form.method === 'dialog' || e.defaultPrevented) return;
      start();
    };

    document.addEventListener('click', handleClick, { capture: true });
    document.addEventListener('submit', handleSubmit, { capture: true });
    return () => {
      document.removeEventListener('click', handleClick, { capture: true });
      document.removeEventListener('submit', handleSubmit, { capture: true });
    };
  }, []);

  // Wenn pathname/search sich ändert → Navigation ist abgeschlossen
  useEffect(() => {
    if (progress !== null) done();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  // Cleanup beim Unmount
  useEffect(() => {
    return () => {
      if (timersRef.current.tick) clearInterval(timersRef.current.tick);
      if (timersRef.current.finish) clearTimeout(timersRef.current.finish);
    };
  }, []);

  if (progress === null) return null;

  return (
    <div
      aria-hidden
      className="fixed top-0 left-0 right-0 h-[2px] z-[100] pointer-events-none"
      style={{ contain: 'strict' }}
    >
      <div
        className="h-full bg-bronze shadow-[0_0_8px_rgba(184,147,90,0.7)] transition-[width] duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
