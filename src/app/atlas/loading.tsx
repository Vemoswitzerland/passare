import { SkeletonGeneric, SkeletonBar } from '@/components/ui/Skeleton';

export default function AtlasLoading() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="border-b border-stone bg-cream/85 backdrop-blur-md h-16 md:h-20" />
      <section className="border-b border-stone py-10">
        <div className="max-w-6xl mx-auto px-6">
          <SkeletonBar className="h-3 w-24 mb-3" />
          <SkeletonBar className="h-10 w-1/2 mb-2" />
          <SkeletonBar className="h-4 w-2/3" />
        </div>
      </section>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-[260px_1fr] gap-6">
          <div className="space-y-4">
            <SkeletonBar className="h-9 w-full rounded-soft" />
            <SkeletonBar className="h-9 w-full rounded-soft" />
            <SkeletonBar className="h-9 w-full rounded-soft" />
          </div>
          <div className="bg-paper border border-stone rounded-card aspect-[16/10] animate-pulse" />
        </div>
        <SkeletonGeneric />
      </div>
    </div>
  );
}
