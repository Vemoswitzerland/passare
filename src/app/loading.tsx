import { SkeletonInseratGrid, SkeletonFilterSidebar } from '@/components/ui/Skeleton';
import { SkeletonBar } from '@/components/ui/Skeleton';

/**
 * Root-Level-Loading — fängt Marktplatz, /preise, /verkaufen, /ratgeber etc. ab.
 * Layout entspricht der Marktplatz-Homepage (Header + Hero + Filter + Grid).
 */
export default function RootLoading() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Header-Strip */}
      <div className="border-b border-stone bg-cream/85 backdrop-blur-md h-16 md:h-20" />

      {/* Hero */}
      <section className="border-b border-stone py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-6">
          <SkeletonBar className="h-3 w-32 mb-4" />
          <SkeletonBar className="h-12 w-3/4 mb-3" />
          <SkeletonBar className="h-4 w-2/3" />
        </div>
      </section>

      {/* Filter + Grid */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid lg:grid-cols-[260px_1fr] gap-8">
          <SkeletonFilterSidebar />
          <div>
            <div className="flex items-center justify-between mb-5">
              <SkeletonBar className="h-3 w-32" />
              <SkeletonBar className="h-9 w-40 rounded-soft" />
            </div>
            <SkeletonInseratGrid count={6} />
          </div>
        </div>
      </div>
    </div>
  );
}
