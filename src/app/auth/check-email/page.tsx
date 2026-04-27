import Link from 'next/link';
import { MailCheck } from 'lucide-react';
import { AuthShell } from '../AuthShell';

export const metadata = {
  title: 'E-Mail bestätigen — passare',
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ email?: string }>;
};

export default async function CheckEmailPage({ searchParams }: Props) {
  const { email } = await searchParams;

  return (
    <AuthShell
      overline="Fast geschafft"
      title="Bitte E-Mail bestätigen."
      intro={
        email ? (
          <>
            Wir haben dir soeben eine Bestätigung an{' '}
            <span className="text-ink font-medium">{email}</span> geschickt.
          </>
        ) : (
          <>Wir haben dir soeben eine Bestätigung per E-Mail geschickt.</>
        )
      }
      footer={
        <>
          Falsche Adresse?&nbsp;
          <Link href="/auth/register" className="editorial text-navy">
            Erneut registrieren
          </Link>
        </>
      }
    >
      <div className="text-center space-y-5 py-2">
        <MailCheck className="w-12 h-12 text-bronze mx-auto" strokeWidth={1.25} />
        <p className="text-body text-ink leading-relaxed">
          Klicke in der E-Mail auf «Konto bestätigen», um die Registrierung
          abzuschliessen.
        </p>
        <p className="text-caption text-quiet leading-relaxed">
          Keine E-Mail erhalten? Bitte auch im Spam-Ordner nachsehen.
          Der Link ist 24 Stunden gültig.
        </p>
      </div>
    </AuthShell>
  );
}
