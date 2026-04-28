import {
  SkeletonPageHeader,
  SkeletonTable,
} from '@/components/admin/Skeleton';

export default function BlogLoading() {
  return (
    <div className="max-w-6xl">
      <SkeletonPageHeader />
      <SkeletonTable rows={6} cols={5} />
    </div>
  );
}
