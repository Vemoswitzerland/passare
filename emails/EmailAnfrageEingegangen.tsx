/**
 * Email: Verkäufer wird über neue Anfrage informiert.
 */
import * as React from 'react';
import { Button, Caption, COLORS, Headline, InfoBox, Layout, Paragraph } from './_layout';
import { Text } from '@react-email/components';

export type EmailAnfrageEingegangenProps = {
  verkaeuferName?: string;
  inseratTitel: string;
  kaeuferTyp?: string;       // z.B. "Privatperson", "Family Office"
  budgetRange?: string;      // z.B. "1–3 Mio CHF"
  timing?: string;           // z.B. "3 Monate"
  nachrichtSnippet?: string;
  appUrl?: string;
  anfrageId: string;
};

export default function EmailAnfrageEingegangen({
  verkaeuferName,
  inseratTitel,
  kaeuferTyp,
  budgetRange,
  timing,
  nachrichtSnippet,
  appUrl = 'https://passare.ch',
  anfrageId,
}: EmailAnfrageEingegangenProps) {
  return (
    <Layout preview={`Neue Anfrage zu: ${inseratTitel}`}>
      <Headline>Neue Anfrage zu deinem Inserat</Headline>

      <Paragraph>
        {verkaeuferName ? `${verkaeuferName}, ein` : 'Ein'} qualifizierter Käufer hat
        Interesse an deinem Inserat <strong>{inseratTitel}</strong> bekundet.
      </Paragraph>

      <InfoBox>
        {kaeuferTyp && (
          <Text style={metaStyle}>
            <strong>Käufer-Typ:</strong> {kaeuferTyp}
          </Text>
        )}
        {budgetRange && (
          <Text style={metaStyle}>
            <strong>Budget:</strong> {budgetRange}
          </Text>
        )}
        {timing && (
          <Text style={metaStyle}>
            <strong>Timing:</strong> {timing}
          </Text>
        )}
        {nachrichtSnippet && (
          <Text style={{ ...metaStyle, fontStyle: 'italic', marginTop: 12 }}>
            «{nachrichtSnippet}»
          </Text>
        )}
      </InfoBox>

      <Paragraph>
        Antworte rasch — Käufer schätzen Reaktionsgeschwindigkeit. Deine durchschnittliche
        Antwortzeit fliesst in deinen Qualitätsscore ein.
      </Paragraph>

      <Button href={`${appUrl}/dashboard/anfragen/${anfrageId}`}>
        Anfrage öffnen
      </Button>

      <Caption>
        Diese Email kannst du in deinen Konto-Einstellungen abbestellen — wir empfehlen
        es aber nicht, weil zeitnahe Antworten dein Profil aufwerten.
      </Caption>
    </Layout>
  );
}

const metaStyle: React.CSSProperties = {
  fontFamily: '"Geist", "Inter", system-ui, sans-serif',
  fontSize: '14px',
  lineHeight: 1.6,
  color: COLORS.ink,
  margin: '0 0 6px 0',
};
