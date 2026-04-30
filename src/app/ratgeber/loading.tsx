import { SkeletonBar } from '@/components/ui/Skeleton';

export default function RatgeberLoading() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="border-b border-stone bg-cream/85 backdrop-blur-md h-16 md:h-20" />
      <section className="py-12">
        <div className="max-w-3xl mx-auto px-6">
          <SkeletonBar className="h-3 w-24 mb-3" />
          <SkeletonBar className="h-10 w-3/4 mb-3" />
          <SkeletonBar className="h-4 w-2/3 mb-10" />
          <div className="space-y-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <article key={i} className="border-b border-stone pb-6">
                <SkeletonBar className="h-3 w-32 mb-2" />
                <SkeletonBar className="h-6 w-5/6 mb-2" />
                <SkeletonBar className="h-3 w-full" />
                <SkeletonBar className="h-3 w-3/4 mt-1" />
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
