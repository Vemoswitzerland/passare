/**
 * Email: Email-Verifizierung nach Registrierung.
 */
import * as React from 'react';
import { Button, Caption, Headline, InfoBox, Layout, Paragraph } from './_layout';

export type EmailVerifizierungProps = {
  name?: string;
  verifyUrl: string;
};

export default function EmailVerifizierung({
  name,
  verifyUrl,
}: EmailVerifizierungProps) {
  return (
    <Layout preview="Bestätige deine Email-Adresse bei passare.">
      <Headline>{name ? `${name}, bitte` : 'Bitte'} bestätige deine Email.</Headline>

      <Paragraph>
        Ein Klick auf den Knopf unten und dein Konto bei passare ist aktiviert. Der
        Link ist 24 Stunden gültig.
      </Paragraph>

      <Button href={verifyUrl}>Email bestätigen</Button>

      <InfoBox>
        <Paragraph>
          Funktioniert der Knopf nicht? Kopier den Link in deinen Browser:
        </Paragraph>
        <Caption>{verifyUrl}</Caption>
      </InfoBox>

      <Caption>
        Du hast dich nicht registriert? Dann kannst du diese Email einfach ignorieren —
        ohne Bestätigung wird kein Konto angelegt.
      </Caption>
    </Layout>
  );
}
