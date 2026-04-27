import Link from 'next/link';
import { AuthShell } from '../AuthShell';
import { ResetForm } from '../ResetForm';

export const metadata = {
  title: 'Passwort zurücksetzen — passare',
  robots: { index: false, follow: false },
};

export default function ResetPage() {
  return (
    <AuthShell
      overline="Passwort vergessen?"
      title="Neues Passwort anfordern."
      intro="Wir senden dir einen Link, um dein Passwort neu zu setzen."
      footer={
        <>
          Doch erinnert?&nbsp;
          <Link href="/auth/login" className="editorial text-navy">
            Zurück zur Anmeldung
          </Link>
        </>
      }
    >
      <ResetForm />
    </AuthShell>
  );
}
