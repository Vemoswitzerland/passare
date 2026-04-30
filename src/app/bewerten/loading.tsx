import { SkeletonForm } from '@/components/ui/Skeleton';

export default function BewertenLoading() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="border-b border-stone bg-cream/85 backdrop-blur-md h-16 md:h-20" />
      <SkeletonForm />
    </div>
  );
}
