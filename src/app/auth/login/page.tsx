import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthShell } from '../AuthShell';
import { LoginForm } from '../LoginForm';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Anmelden — passare',
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect('/dashboard');

  return (
    <AuthShell
      overline="Anmelden"
      title="Willkommen zurück."
      intro="Melde dich mit E-Mail und Passwort an."
      footer={
        <>
          Noch kein Konto?&nbsp;
          <Link href="/auth/register" className="editorial text-navy">
            Jetzt registrieren
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
