import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { InseratWizard } from '../../components/InseratWizard';

export const metadata = { title: 'Inserat bearbeiten — passare' };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; step?: string }>;
};

export default async function EditInseratPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) notFound();

  const { data: inserat } = await supabase
    .from('inserate')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!inserat) notFound();
  if (inserat.owner_id !== userData.user.id) notFound();

  // Step aus Query oder default 2 (wenn Pre-Reg übernommen → Step 2)
  const initialStep = sp.step ? Number(sp.step) : sp.from === 'pre-reg' ? 2 : 1;

  return (
    <div className="px-6 md:px-10 py-8 md:py-12">
      <div className="max-w-3xl mx-auto">
        <InseratWizard inserat={inserat} initialStep={initialStep} fromPreReg={sp.from === 'pre-reg'} />
      </div>
    </div>
  );
}
