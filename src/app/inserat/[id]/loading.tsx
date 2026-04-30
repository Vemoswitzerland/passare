import { SkeletonInseratDetail } from '@/components/ui/Skeleton';

/**
 * Loading-State für Inserat-Detail-Page.
 * Erscheint sofort beim Klick auf eine Inserat-Card im Marktplatz —
 * ersetzt das vorherige weiße Warten ohne Feedback.
 */
export default function InseratDetailLoading() {
  return <SkeletonInseratDetail />;
}
