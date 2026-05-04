import { redirect } from 'next/navigation';

export const metadata = { title: 'Anfrage — Käufer · passare', robots: { index: false, follow: false } };

type Props = { params: Promise<{ id: string }> };

/**
 * Detail-Stub: Redirect auf die Inbox mit aktivem Thread.
 * Cyrill: Detail-View ist die Inbox selber — der Thread wird per
 * `?thread=k:<id>` ausgewählt. Eine separate Detail-Seite bringt
 * keinen Mehrwert, solange der Thread-Layout-Container es schafft.
 */
export default async function AnfrageDetailRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/dashboard/kaeufer/anfragen?thread=k:${id}`);
}
