import * as React from 'react';
import { cn } from '@/lib/utils';

type RevealProps = React.HTMLAttributes<HTMLDivElement> & {
  delay?: number;
  as?: 'div' | 'section' | 'article' | 'span';
  /** Beibehalten für API-Kompatibilität — wird ignoriert (CSS-Animation läuft immer beim Mount). */
  once?: boolean;
};

/**
 * Fade-up Reveal — pure CSS-Animation auf Mount.
 *
 * Cyrill 2026-05-05: Vorher framer-motion `whileInView` — der Hook hat
 * unzuverlässig getriggert wenn ein Element initial Above-the-Fold UND
 * height 0 hatte (Henne-Ei). Hero-Sections blieben unsichtbar bis der
 * User scrollte. Lösung: Tailwind-`animate-fade-up` (=keyframe `fadeUp`)
 * läuft 700ms beim ersten Mount, garantiert sichtbar. `prefers-reduced-
 * motion` greift via `globals.css` Media-Query und reduziert die
 * Animation-Duration auf 0.01ms.
 *
 * Trade-off: Keine Scroll-Triggered-Reveals mehr — Below-the-Fold
 * Elemente animieren auch beim Page-Load (im JS-Bundle aber instant
 * ausgeblendet falls bereits vergangen). Net-Effekt: Robuste Animation,
 * kein Lipgloss aber zuverlässig.
 */
export function Reveal({ children, className, delay = 0, ...props }: RevealProps) {
  // `once`, `as` werden nicht ausgewertet — API-Compat.
  const { once: _once, as: _as, ...rest } = props as RevealProps & { once?: boolean };
  return (
    <div
      className={cn('animate-fade-up', className)}
      style={delay ? { animationDelay: `${delay}s` } : undefined}
      {...rest}
    >
      {children}
    </div>
  );
}

type RevealStaggerProps = {
  children: React.ReactNode;
  className?: string;
  /** Stagger-Delay zwischen Items in Sekunden. */
  gap?: number;
};

/**
 * Stagger-Wrapper — gibt jedem Kind ein gestaffeltes `animationDelay`.
 * Funktioniert mit React.Children.map, also direkte Children müssen
 * `<RevealItem>` oder `<div>` sein.
 */
export function RevealStagger({ children, className, gap = 0.08 }: RevealStaggerProps) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, i) => {
        if (!React.isValidElement(child)) return child;
        const childProps = (child.props ?? {}) as { style?: React.CSSProperties; className?: string };
        return React.cloneElement(child as React.ReactElement<{ style?: React.CSSProperties; className?: string }>, {
          style: { ...childProps.style, animationDelay: `${i * gap}s` },
        });
      })}
    </div>
  );
}

export function RevealItem({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={cn('animate-fade-up', className)} style={style}>
      {children}
    </div>
  );
}
