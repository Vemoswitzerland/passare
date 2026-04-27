/**
 * Email: Käufer bekommt Antwort auf seine Anfrage.
 */
import * as React from 'react';
import { Button, Caption, COLORS, Headline, InfoBox, Layout, Paragraph } from './_layout';
import { Text } from '@react-email/components';

export type EmailAnfrageBeantwortetProps = {
  kaeuferName?: string;
  inseratTitel: string;
  verkaeuferKuerzel?: string;       // z.B. "S.M." (anonym)
  antwortSnippet?: string;
  appUrl?: string;
  anfrageId: string;
};

export default function EmailAnfrageBeantwortet({
  kaeuferName,
  inseratTitel,
  verkaeuferKuerzel,
  antwortSnippet,
  appUrl = 'https://passare.ch',
  anfrageId,
}: EmailAnfrageBeantwortetProps) {
  return (
    <Layout preview={`Antwort zu deiner Anfrage: ${inseratTitel}`}>
      <Headline>Du hast eine Antwort erhalten</Headline>

      <Paragraph>
        {kaeuferName ? `${kaeuferName}, der` : 'Der'} Verkäufer
        {verkaeuferKuerzel ? ` (${verkaeuferKuerzel})` : ''} hat auf deine Anfrage zu
        <strong> {inseratTitel}</strong> reagiert.
      </Paragraph>

      {antwortSnippet && (
        <InfoBox>
          <Text style={quoteStyle}>«{antwortSnippet}»</Text>
        </InfoBox>
      )}

      <Paragraph>
        Lies die vollständige Antwort im Dashboard und reagiere direkt aus dem
        Anfrage-Faden. Sensible Details werden erst nach NDA-Unterzeichnung freigegeben.
      </Paragraph>

      <Button href={`${appUrl}/dashboard/anfragen/${anfrageId}`}>
        Antwort öffnen
      </Button>

      <Caption>
        Tipp: Aktiviere passare MAX um Anfragen mit Priorität zu stellen und früher
        Antworten zu erhalten.
      </Caption>
    </Layout>
  );
}

const quoteStyle: React.CSSProperties = {
  fontFamily: '"Fraunces", Georgia, serif',
  fontSize: '16px',
  lineHeight: 1.55,
  fontStyle: 'italic',
  color: COLORS.ink,
  margin: 0,
};
