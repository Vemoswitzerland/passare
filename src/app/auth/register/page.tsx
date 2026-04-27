import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthShell } from '../AuthShell';
import { RegisterForm } from '../RegisterForm';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Konto erstellen — passare',
  robots: { index: false, follow: false },
};

export default async function RegisterPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect('/dashboard');

  return (
    <AuthShell
      overline="Kostenlos registrieren"
      title="Konto erstellen."
      intro={
        <>
          Lege dein passare-Konto an. In einem nächsten Schritt wählst du,
          ob du <em>verkaufen</em> oder <em>kaufen</em> möchtest.
        </>
      }
      footer={
        <>
          Bereits registriert?&nbsp;
          <Link href="/auth/login" className="editorial text-navy">
            Hier anmelden
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
