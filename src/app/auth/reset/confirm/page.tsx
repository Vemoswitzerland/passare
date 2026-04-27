import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthShell } from '../../AuthShell';
import { ResetConfirmForm } from '../../ResetConfirmForm';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Neues Passwort setzen — passare',
  robots: { index: false, follow: false },
};

export default async function ResetConfirmPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  // Wenn keine Recovery-Session vorliegt, zurück zur Anforderung
  if (!data.user) {
    redirect('/auth/reset?expired=1');
  }

  return (
    <AuthShell
      overline="Sicher anmelden"
      title="Neues Passwort setzen."
      intro="Wähle ein starkes Passwort mit mindestens 8 Zeichen."
      footer={
        <>
          Doch nicht?&nbsp;
          <Link href="/auth/login" className="editorial text-navy">
            Zurück zur Anmeldung
          </Link>
        </>
      }
    >
      <ResetConfirmForm />
    </AuthShell>
  );
}
