import { SkeletonBar } from '@/components/ui/Skeleton';

export default function AnfrageDetailLoading() {
  return (
    <div className="max-w-4xl">
      <SkeletonBar className="h-3 w-32 mb-4" />
      <SkeletonBar className="h-8 w-2/3 mb-6" />
      <div className="grid md:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-4">
          <div className="bg-paper border border-stone rounded-card p-5">
            <SkeletonBar className="h-3 w-20 mb-3" />
            <SkeletonBar className="h-3 w-full mb-2" />
            <SkeletonBar className="h-3 w-5/6 mb-2" />
            <SkeletonBar className="h-3 w-3/4" />
          </div>
          <div className="bg-paper border border-stone rounded-card p-5">
            <SkeletonBar className="h-3 w-24 mb-3" />
            <SkeletonBar className="h-3 w-full mb-2" />
            <SkeletonBar className="h-3 w-5/6" />
          </div>
        </div>
        <aside className="space-y-3">
          <div className="bg-paper border border-stone rounded-card p-4">
            <SkeletonBar className="h-3 w-16 mb-2" />
            <SkeletonBar className="h-7 w-24 mb-3" />
            <SkeletonBar className="h-9 w-full rounded-soft" />
          </div>
        </aside>
      </div>
    </div>
  );
}
