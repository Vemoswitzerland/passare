import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ExpertenForm } from '../ExpertenForm';

export const metadata = { title: 'Experte bearbeiten · Admin — passare', robots: { index: false, follow: false } };

type Props = { params: Promise<{ id: string }> };

export default async function EditExpertePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: e } = await supabase
    .from('experten')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (!e) notFound();

  return (
    <ExpertenForm
      experteId={id}
      initial={{
        name: e.name as string,
        funktion: (e.funktion as string | null) ?? '',
        bio: (e.bio as string | null) ?? '',
        email: (e.email as string | null) ?? '',
        foto_url: (e.foto_url as string | null) ?? '',
        expertise: (e.expertise as string[] | null) ?? [],
        honorar_chf_pro_stunde: Number(e.honorar_chf_pro_stunde),
        slot_dauer_min: Number(e.slot_dauer_min),
        available_weekdays: (e.available_weekdays as number[] | null) ?? [1, 2, 3, 4, 5],
        available_hours_start: (e.available_hours_start as string) ?? '09:00',
        available_hours_end: (e.available_hours_end as string) ?? '17:00',
        slot_intervall_min: Number(e.slot_intervall_min),
        is_active: Boolean(e.is_active),
        sort_order: Number(e.sort_order),
      }}
    />
  );
}
