import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { takeOverPreRegDraft } from '../actions';

export const metadata = { title: 'Inserat erstellen — passare' };

export default async function NewInseratPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect('/auth/login');

  // 1. Pre-Reg-Cookie übernehmen falls vorhanden
  const preRegId = await takeOverPreRegDraft();
  if (preRegId) {
    redirect(`/dashboard/verkaeufer/inserat/${preRegId}/edit?from=pre-reg`);
  }

  // 2. Schon ein Entwurf vorhanden?
  const { data: existing } = await supabase
    .from('inserate')
    .select('id, status')
    .eq('verkaeufer_id', userData.user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    redirect(`/dashboard/verkaeufer/inserat/${existing.id}/edit`);
  }

  // 3. Neuen Entwurf erstellen
  const { data: created, error } = await supabase
    .from('inserate')
    .insert({ verkaeufer_id: userData.user.id, status: 'entwurf' })
    .select('id')
    .single();

  if (error || !created) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="text-body text-danger">Inserat konnte nicht erstellt werden: {error?.message}</p>
      </div>
    );
  }

  redirect(`/dashboard/verkaeufer/inserat/${created.id}/edit`);
}
