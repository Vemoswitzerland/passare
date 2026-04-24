'use client';

import * as React from 'react';
import { motion } from 'framer-motion';

type RevealProps = React.HTMLAttributes<HTMLDivElement> & {
  delay?: number;
  as?: 'div' | 'section' | 'article' | 'span';
  once?: boolean;
};

/**
 * Scroll-Reveal mit fade-up.
 * Duration 700ms, cubic-bezier expo-out. Dezent.
 */
export function Reveal({ children, className, delay = 0, once = true, ...props }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-50px' }}
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
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
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
