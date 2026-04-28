import { SkeletonPageHeader, SkeletonKpiGrid, SkeletonTable } from '@/components/admin/Skeleton';

/**
 * Default-Loading für /admin/* Routes.
 * Wird von Next.js automatisch zwischen Page-Wechseln gezeigt — sofort,
 * ohne weisse Seite. Pattern wie app.vemo.ch.
 */
export default function AdminLoading() {
  return (
    <div className="max-w-6xl">
      <SkeletonPageHeader />
      <SkeletonKpiGrid />
      <SkeletonTable rows={8} cols={6} />
    </div>
  );
}
