import {
  SkeletonPageHeader,
  SkeletonFilterBar,
  SkeletonTable,
} from '@/components/admin/Skeleton';

export default function InserateLoading() {
  return (
    <div className="max-w-6xl">
      <SkeletonPageHeader />
      <SkeletonFilterBar />
      <SkeletonTable rows={10} cols={7} />
    </div>
  );
}
