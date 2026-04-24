import { cn } from '@/lib/utils';

type DotPatternProps = {
  className?: string;
  size?: number;    // Dot-Radius in px
  spacing?: number; // Abstand in px
  color?: string;   // CSS color
  fade?: boolean;   // Radial-Fade gegen Rand
};

/**
 * Dezentes Dot-Grid als Hero-Background.
 * Linear.app / Vercel-Stil. Nur SVG, kein JS.
 */
export function DotPattern({
  className,
  size = 1,
  spacing = 24,
  color = 'rgba(11, 31, 58, 0.12)',
  fade = true,
}: DotPatternProps) {
  return (
    <svg
      aria-hidden
      className={cn(
        'absolute inset-0 h-full w-full pointer-events-none',
        fade && '[mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]',
        className,
      )}
    >
      <defs>
        <pattern
          id="passare-dot-pattern"
          x="0"
          y="0"
          width={spacing}
          height={spacing}
          patternUnits="userSpaceOnUse"
        >
          <circle cx={spacing / 2} cy={spacing / 2} r={size} fill={color} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#passare-dot-pattern)" />
    </svg>
  );
}

/**
 * Subtile vertikale Grid-Linien (Swiss-Raster-Optik).
 * Nur desktop, max. 4 Spalten als Linien.
 */
export function GridLines({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'absolute inset-0 pointer-events-none hidden md:block',
        '[mask-image:linear-gradient(to_bottom,black,transparent_90%)]',
        className,
      )}
    >
      <div className="mx-auto max-w-content h-full px-6 md:px-10">
        <div className="relative h-full grid grid-cols-4">
          <div className="border-l border-navy/5" />
          <div className="border-l border-navy/5" />
          <div className="border-l border-navy/5" />
          <div className="border-l border-navy/5 border-r border-navy/5" />
        </div>
      </div>
    </div>
  );
}
