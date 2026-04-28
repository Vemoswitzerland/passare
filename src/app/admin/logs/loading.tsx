import {
  SkeletonPageHeader,
  SkeletonTable,
} from '@/components/admin/Skeleton';

export default function LogsLoading() {
  return (
    <div className="max-w-6xl">
      <SkeletonPageHeader />
      <SkeletonTable rows={15} cols={5} />
    </div>
  );
}
