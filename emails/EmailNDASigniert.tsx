/**
 * Email: Verkäufer wird über NDA-Signatur informiert.
 */
import * as React from 'react';
import { Button, Caption, COLORS, Headline, InfoBox, Layout, Paragraph } from './_layout';
import { Text } from '@react-email/components';

export type EmailNDASigniertProps = {
  verkaeuferName?: string;
  inseratTitel: string;
  kaeuferKuerzel?: string;       // anonyme Initialen
  signiertAm: string;            // z.B. "27. April 2026, 14:32"
  appUrl?: string;
  inseratId: string;
};

export default function EmailNDASigniert({
  verkaeuferName,
  inseratTitel,
  kaeuferKuerzel,
  signiertAm,
  appUrl = 'https://passare.ch',
  inseratId,
}: EmailNDASigniertProps) {
  return (
    <Layout preview={`NDA unterzeichnet: ${inseratTitel}`}>
      <Headline>NDA wurde unterzeichnet</Headline>

      <Paragraph>
        {verkaeuferName ? `${verkaeuferName}, ein` : 'Ein'} Käufer
        {kaeuferKuerzel ? ` (${kaeuferKuerzel})` : ''} hat das Geheimhaltungs-Dokument zu
        deinem Inserat <strong>{inseratTitel}</strong> unterzeichnet.
      </Paragraph>

      <InfoBox>
        <Text style={metaStyle}><strong>Inserat:</strong> {inseratTitel}</Text>
        <Text style={metaStyle}><strong>Signiert am:</strong> {signiertAm}</Text>
        {kaeuferKuerzel && (
          <Text style={metaStyle}><strong>Käufer-Kennzeichen:</strong> {kaeuferKuerzel}</Text>
        )}
      </InfoBox>

      <Paragraph>
        Der Datenraum ist für diesen Käufer jetzt freigegeben. Du kannst die
        NDA-Unterschrift als PDF aus dem Dashboard exportieren — rechtsgültig dank
        qualifizierter elektronischer Signatur (QES).
      </Paragraph>

      <Button href={`${appUrl}/dashboard/inserate/${inseratId}/datenraum`}>
        Datenraum öffnen
      </Button>

      <Caption>
        Das NDA-Dokument liegt rechtskonform unterzeichnet bei uns. Wir archivieren
        Signaturen 10 Jahre gemäss OR.
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
