/**
 * Skeleton-Building-Blocks für Admin-Loading-States.
 * Nutzt CSS-Pulse (kein JS) — rendert sofort beim Tab-Switch.
 */

export function SkeletonBar({ className = '' }: { className?: string }) {
  return <div className={`bg-stone/60 rounded animate-pulse ${className}`} />;
}

/** Page-Header-Skeleton (passt zu allen Admin-Pages mit PageHeader). */
export function SkeletonPageHeader() {
  return (
    <div className="mb-4">
      <SkeletonBar className="h-3 w-20 mb-2" />
      <SkeletonBar className="h-7 w-48" />
    </div>
  );
}

/** Tabellen-Skeleton (n Zeilen). */
export function SkeletonTable({ rows = 8, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-paper border border-stone rounded-soft overflow-hidden">
      {/* Header */}
      <div
        className="grid border-b border-stone bg-cream/40 px-3 py-2 gap-3"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBar key={i} className="h-3" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="grid border-b border-stone/40 last:border-0 px-3 py-3 gap-3"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonBar key={c} className="h-3" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Filter-Bar-Skeleton (Buttons + Search). */
export function SkeletonFilterBar() {
  return (
    <div className="flex items-center gap-2 mb-4">
      <SkeletonBar className="h-7 w-16 rounded-soft" />
      <SkeletonBar className="h-7 w-20 rounded-soft" />
      <SkeletonBar className="h-7 w-20 rounded-soft" />
      <SkeletonBar className="h-7 w-20 rounded-soft" />
      <SkeletonBar className="h-7 flex-1 max-w-xs rounded-soft ml-auto" />
    </div>
  );
}

/** KPI-Karten-Skeleton (Dashboard). */
export function SkeletonKpiGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-paper border border-stone rounded-soft p-3">
          <SkeletonBar className="h-3 w-16 mb-2" />
          <SkeletonBar className="h-6 w-12" />
        </div>
      ))}
    </div>
  );
}

/** Detail-Page-Skeleton (Header + Two-Column Grid). */
export function SkeletonDetailPage() {
  return (
    <div className="max-w-5xl">
      <SkeletonBar className="h-3 w-32 mb-4" />
      <header className="bg-paper border border-stone rounded-soft p-4 mb-4 flex gap-4">
        <SkeletonBar className="w-12 h-12 rounded-full" />
        <div className="flex-1">
          <SkeletonBar className="h-4 w-48 mb-2" />
          <SkeletonBar className="h-3 w-32 mb-3" />
          <div className="grid grid-cols-2 gap-2">
            <SkeletonBar className="h-3 w-40" />
            <SkeletonBar className="h-3 w-36" />
            <SkeletonBar className="h-3 w-32" />
            <SkeletonBar className="h-3 w-44" />
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <SkeletonBar className="w-14 h-14 rounded-full" />
        </div>
      </header>
      <div className="grid lg:grid-cols-[1fr_300px] gap-4">
        <div className="space-y-4">
          <SkeletonBar className="h-32 rounded-soft" />
          <SkeletonBar className="h-32 rounded-soft" />
          <SkeletonBar className="h-24 rounded-soft" />
        </div>
        <SkeletonBar className="h-48 rounded-soft" />
      </div>
    </div>
  );
}
