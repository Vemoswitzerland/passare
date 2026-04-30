import { SkeletonBar } from '@/components/ui/Skeleton';

export default function RatgeberArticleLoading() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="border-b border-stone bg-cream/85 backdrop-blur-md h-16 md:h-20" />
      <article className="max-w-3xl mx-auto px-6 py-12">
        <SkeletonBar className="h-3 w-24 mb-3" />
        <SkeletonBar className="h-10 w-3/4 mb-2" />
        <SkeletonBar className="h-10 w-1/2 mb-6" />
        <SkeletonBar className="h-4 w-1/3 mb-10" />
        <div className="space-y-3">
          <SkeletonBar className="h-3 w-full" />
          <SkeletonBar className="h-3 w-full" />
          <SkeletonBar className="h-3 w-5/6" />
          <SkeletonBar className="h-3 w-full" />
          <SkeletonBar className="h-3 w-4/5" />
        </div>
      </article>
    </div>
  );
}
