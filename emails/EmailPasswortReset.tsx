/**
 * Email: Passwort zurücksetzen.
 */
import * as React from 'react';
import { Button, Caption, Headline, InfoBox, Layout, Paragraph } from './_layout';

export type EmailPasswortResetProps = {
  name?: string;
  resetUrl: string;
};

export default function EmailPasswortReset({
  name,
  resetUrl,
}: EmailPasswortResetProps) {
  return (
    <Layout preview="Setze dein passare-Passwort zurück.">
      <Headline>Passwort zurücksetzen</Headline>

      <Paragraph>
        {name ? `Hallo ${name}, du` : 'Du'} hast ein neues Passwort für dein
        passare-Konto angefordert. Klick den Knopf, um eines zu vergeben — der Link ist
        eine Stunde gültig.
      </Paragraph>

      <Button href={resetUrl}>Neues Passwort setzen</Button>

      <InfoBox>
        <Paragraph>
          Link funktioniert nicht? In den Browser kopieren:
        </Paragraph>
        <Caption>{resetUrl}</Caption>
      </InfoBox>

      <Caption>
        Wenn du das nicht warst: Ignoriere diese Email. Dein Passwort bleibt
        unverändert. Aus Sicherheitsgründen prüfen wir verdächtige Aktivität auf
        deinem Konto automatisch.
      </Caption>
    </Layout>
  );
}
