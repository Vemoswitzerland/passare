'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

type RevealProps = React.HTMLAttributes<HTMLDivElement> & {
  delay?: number;
  as?: 'div' | 'section' | 'article' | 'span';
  once?: boolean;
};

/**
 * Scroll-Reveal mit fade-up.
 * Duration 700ms, cubic-bezier expo-out. Dezent.
 *
 * Cyrill 2026-05-05: Bug — wenn ein Reveal-Element initial im Viewport ist,
 * triggert IntersectionObserver in seltenen Fällen nicht (z.B. wenn das
 * Hero-Element noch nicht gemessen wurde) und das Element bleibt mit
 * opacity:0 unsichtbar. Lösung: Nach Mount setzen wir mit useEffect den
 * `animate`-Wert hart auf «visible» falls bereits in der Above-the-Fold-Zone
 * (oder als Fallback nach 250ms). Damit ist die Hero-Section sofort sichtbar,
 * spätere Reveals kommen weiterhin per Scroll-Trigger.
 */
export function Reveal({ children, className, delay = 0, once = true, ...props }: RevealProps) {
  const reducedMotion = useReducedMotion();
  const [forced, setForced] = React.useState(false);

  React.useEffect(() => {
    // Wenn der User reduced-motion will: sofort sichtbar.
    if (reducedMotion) {
      setForced(true);
      return;
    }
    // Fallback: Nach 250ms ist auf jeden Fall sichtbar.
    // whileInView läuft normalerweise davor; falls nicht (Above-the-Fold-
    // Hero-Bug), greift dieser Timer.
    const t = window.setTimeout(() => setForced(true), 250);
    return () => window.clearTimeout(t);
  }, [reducedMotion]);

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 16 }}
      animate={forced ? { opacity: 1, y: 0 } : undefined}
      whileInView={forced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once, margin: '0px', amount: 0.05 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
      {...(props as object)}
    >
      {children}
    </motion.div>
  );
}

type RevealStaggerProps = {
  children: React.ReactNode;
  className?: string;
  gap?: number; // Staggering delay in Sekunden
};

/** Stagger-Wrapper für Listen — jedes Kind wird nacheinander eingeblendet */
export function RevealStagger({ children, className, gap = 0.08 }: RevealStaggerProps) {
  const reducedMotion = useReducedMotion();
  const [forced, setForced] = React.useState(false);

  React.useEffect(() => {
    if (reducedMotion) {
      setForced(true);
      return;
    }
    const t = window.setTimeout(() => setForced(true), 250);
    return () => window.clearTimeout(t);
  }, [reducedMotion]);

  return (
    <motion.div
      initial={reducedMotion ? 'visible' : 'hidden'}
      animate={forced ? 'visible' : undefined}
      whileInView={forced ? undefined : 'visible'}
      viewport={{ once: true, margin: '0px', amount: 0.05 }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: gap } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
