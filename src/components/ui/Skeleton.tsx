/**
 * Generische Skeleton-Building-Blocks — werden überall in loading.tsx
 * verwendet. CSS-Pulse-Animation (kein JS), rendert sofort.
 *
 * Design: bg-stone/60 mit animate-pulse, rounded-soft. Passt zur passare-
 * Palette (kein generisches grau).
 */

export function SkeletonBar({ className = '' }: { className?: string }) {
  return <div className={`bg-stone/60 rounded animate-pulse ${className}`} />;
}

/** Inserat-Card-Skeleton (Marktplatz, Käufer-Favoriten, …). */
export function SkeletonInseratCard() {
  return (
    <div className="bg-paper border border-stone rounded-card overflow-hidden">
      {/* Cover */}
      <div className="aspect-[16/10] bg-stone/40 animate-pulse" />
      {/* Content */}
      <div className="p-5">
        <SkeletonBar className="h-3 w-24 mb-3" />
        <SkeletonBar className="h-5 w-full mb-2" />
        <SkeletonBar className="h-5 w-3/4 mb-4" />
        <div className="grid grid-cols-2 gap-2 mb-4">
          <SkeletonBar className="h-3" />
          <SkeletonBar className="h-3" />
          <SkeletonBar className="h-3 w-3/4" />
          <SkeletonBar className="h-3 w-5/6" />
        </div>
        <SkeletonBar className="h-9 w-full rounded-soft" />
      </div>
    </div>
  );
}

/** Marktplatz-Grid-Skeleton (n Cards). */
export function SkeletonInseratGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonInseratCard key={i} />
      ))}
    </div>
  );
}

/** Inserat-Detail-Page-Skeleton (Cover + Body + Sidebar). */
export function SkeletonInseratDetail() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Header-Strip */}
      <div className="border-b border-stone bg-cream/85 backdrop-blur-md h-16 md:h-20" />

      {/* Cover */}
      <div className="aspect-[21/9] bg-stone/40 animate-pulse" />

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid lg:grid-cols-[1fr_360px] gap-10">
          {/* Body */}
          <div>
            <SkeletonBar className="h-3 w-32 mb-3" />
            <SkeletonBar className="h-10 w-3/4 mb-2" />
            <SkeletonBar className="h-10 w-1/2 mb-6" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-paper border border-stone rounded-soft p-3">
                  <SkeletonBar className="h-2 w-16 mb-2" />
                  <SkeletonBar className="h-5 w-20" />
                </div>
              ))}
            </div>
            <div className="space-y-3 mb-8">
              <SkeletonBar className="h-3" />
              <SkeletonBar className="h-3" />
              <SkeletonBar className="h-3 w-5/6" />
              <SkeletonBar className="h-3 w-4/5" />
              <SkeletonBar className="h-3 w-2/3" />
            </div>
          </div>
          {/* Sidebar */}
          <aside>
            <div className="bg-paper border border-stone rounded-card p-5 sticky top-24">
              <SkeletonBar className="h-3 w-20 mb-3" />
              <SkeletonBar className="h-7 w-32 mb-5" />
              <SkeletonBar className="h-10 w-full rounded-soft mb-3" />
              <SkeletonBar className="h-10 w-full rounded-soft mb-5" />
              <div className="space-y-2">
                <SkeletonBar className="h-3" />
                <SkeletonBar className="h-3 w-5/6" />
                <SkeletonBar className="h-3 w-3/4" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/** Dashboard-Page-Skeleton (Header + KPI + Liste). */
export function SkeletonDashboard() {
  return (
    <div>
      <div className="mb-6">
        <SkeletonBar className="h-3 w-24 mb-2" />
        <SkeletonBar className="h-8 w-64" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-paper border border-stone rounded-soft p-4">
            <SkeletonBar className="h-3 w-16 mb-2" />
            <SkeletonBar className="h-6 w-12" />
          </div>
        ))}
      </div>
      <div className="bg-paper border border-stone rounded-card p-5">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-stone/40 last:border-0">
              <SkeletonBar className="w-10 h-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <SkeletonBar className="h-3 w-2/3" />
                <SkeletonBar className="h-3 w-1/3" />
              </div>
              <SkeletonBar className="h-7 w-20 rounded-soft" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Form-Page-Skeleton (Auth/Onboarding/Wizards). */
export function SkeletonForm() {
  return (
    <div className="max-w-md mx-auto py-16 px-6">
      <SkeletonBar className="h-3 w-20 mb-3 mx-auto" />
      <SkeletonBar className="h-9 w-3/4 mb-3 mx-auto" />
      <SkeletonBar className="h-3 w-full mb-2 mx-auto" />
      <SkeletonBar className="h-3 w-5/6 mb-8 mx-auto" />
      <div className="space-y-4">
        <div>
          <SkeletonBar className="h-3 w-16 mb-2" />
          <SkeletonBar className="h-10 w-full rounded-soft" />
        </div>
        <div>
          <SkeletonBar className="h-3 w-20 mb-2" />
          <SkeletonBar className="h-10 w-full rounded-soft" />
        </div>
        <SkeletonBar className="h-11 w-full rounded-soft mt-6" />
      </div>
    </div>
  );
}

/** Filter-Sidebar-Skeleton (Marktplatz). */
export function SkeletonFilterSidebar() {
  return (
    <aside className="space-y-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i}>
          <SkeletonBar className="h-3 w-20 mb-2" />
          <SkeletonBar className="h-9 w-full rounded-soft" />
        </div>
      ))}
    </aside>
  );
}

/** Generic centered spinner — für Edge-Cases wo kein passendes Skeleton existiert. */
export function SkeletonGeneric() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-2 border-stone border-t-bronze rounded-full animate-spin" />
        <p className="font-mono text-caption text-quiet mt-3 uppercase tracking-widest">Wird geladen…</p>
      </div>
    </div>
  );
}
