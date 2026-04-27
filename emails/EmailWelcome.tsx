/**
 * Email: Welcome — nach erfolgreicher Registrierung.
 */
import * as React from 'react';
import { Button, Caption, Headline, Layout, Paragraph } from './_layout';

export type EmailWelcomeProps = {
  name?: string;
  appUrl?: string;
};

export default function EmailWelcome({
  name,
  appUrl = 'https://passare.ch',
}: EmailWelcomeProps) {
  const greeting = name ? `Hallo ${name}` : 'Willkommen';

  return (
    <Layout preview="Willkommen bei passare — dein Schweizer Marktplatz für Unternehmensverkäufe.">
      <Headline>{greeting} bei passare.</Headline>

      <Paragraph>
        Schön, dass du an Bord bist. passare verbindet Schweizer KMU-Inhaberinnen und
        -Inhaber mit qualifizierten, geprüften Käuferinnen und Käufern — diskret und
        kuratiert.
      </Paragraph>

      <Paragraph>
        Als Nächstes: Konto einrichten, Rolle wählen (verkaufen oder kaufen) und das
        Profil vervollständigen. Das dauert keine fünf Minuten.
      </Paragraph>

      <Button href={`${appUrl}/dashboard`}>Zum Dashboard</Button>

      <Caption>
        Fragen? Antworte einfach auf diese Email — wir lesen jede persönlich.
      </Caption>
    </Layout>
  );
}
