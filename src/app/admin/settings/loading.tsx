import { SkeletonPageHeader, SkeletonBar } from '@/components/admin/Skeleton';

export default function SettingsLoading() {
  return (
    <div className="max-w-3xl space-y-4">
      <SkeletonPageHeader />
      <SkeletonBar className="h-32 rounded-soft" />
      <SkeletonBar className="h-32 rounded-soft" />
      <SkeletonBar className="h-32 rounded-soft" />
    </div>
  );
}
