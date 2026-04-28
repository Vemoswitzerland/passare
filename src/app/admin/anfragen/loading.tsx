import {
  SkeletonPageHeader,
  SkeletonFilterBar,
  SkeletonTable,
} from '@/components/admin/Skeleton';

export default function AnfragenLoading() {
  return (
    <div className="max-w-6xl">
      <SkeletonPageHeader />
      <SkeletonFilterBar />
      <SkeletonTable rows={10} cols={6} />
    </div>
  );
}
