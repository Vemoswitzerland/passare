import { useEffect, useRef, useState } from 'react';

/**
 * Typewriter-Effekt: gibt einen Text Buchstabe-für-Buchstabe als String
 * zurück. Sobald `complete()` aufgerufen wird (z.B. wenn der User in
 * das Feld klickt), wird der volle Text sofort angezeigt.
 *
 * Cyrill: «als würde jemand schreiben — bei den einzelnen Zeilen muss
 * ein cooler Wow-Effekt kommen».
 *
 * @param target — der finale Text (kann auch null/leer sein)
 * @param opts.enabled — ob der Effekt aktiv ist (default: true)
 * @param opts.startDelay — Verzögerung in ms bevor Tippen startet
 * @param opts.charDelay — ms pro Zeichen (default: 12 ms = ~80 cps)
 */
export function useTypewriter(
  target: string | null | undefined,
  opts: { enabled?: boolean; startDelay?: number; charDelay?: number } = {},
): { text: string; isTyping: boolean; complete: () => void } {
  const { enabled = true, startDelay = 0, charDelay = 12 } = opts;
  const [text, setText] = useState(enabled ? '' : target ?? '');
  const [isTyping, setIsTyping] = useState(false);
  const completedRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!enabled || !target) {
      setText(target ?? '');
      return;
    }
    completedRef.current = false;
    const startT = setTimeout(() => {
      if (completedRef.current) return;
      setIsTyping(true);
      const chars = Array.from(target);
      chars.forEach((_, i) => {
        const t = setTimeout(() => {
          if (completedRef.current) return;
          setText(target.slice(0, i + 1));
          if (i === chars.length - 1) setIsTyping(false);
        }, i * charDelay);
        timersRef.current.push(t);
      });
    }, startDelay);
    timersRef.current.push(startT);

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const complete = () => {
    completedRef.current = true;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setText(target ?? '');
    setIsTyping(false);
  };

  return { text, isTyping, complete };
}

/**
 * Berechnet die Start-Verzögerung für sequenzielles Typewriter-
 * Cascading. Pro Feld wird die Zeit für das vorherige Feld plus eine
 * kleine Pause addiert.
 *
 * @example
 *   const delays = staggerDelays([titel, teaser, beschreibung], 12, 200);
 *   // → [0, titel.length*12 + 200, ...]
 */
export function staggerDelays(
  texts: Array<string | null | undefined>,
  charDelay = 12,
  pause = 200,
): number[] {
  let cumulative = 0;
  return texts.map((t) => {
    const start = cumulative;
    cumulative += (t?.length ?? 0) * charDelay + pause;
    return start;
  });
}
