/**
 * Email: Reminder 14 Tage vor Inserat-Ablauf.
 */
import * as React from 'react';
import { Button, Caption, COLORS, Headline, InfoBox, Layout, Paragraph } from './_layout';
import { Text } from '@react-email/components';

export type EmailInseratBaldAbgelaufenProps = {
  verkaeuferName?: string;
  inseratTitel: string;
  abgelaufenAm: string;        // "11. Mai 2026"
  tageVerbleibend: number;     // 14
  anzahlAnfragen?: number;
  views?: number;
  appUrl?: string;
  inseratId: string;
};

export default function EmailInseratBaldAbgelaufen({
  verkaeuferName,
  inseratTitel,
  abgelaufenAm,
  tageVerbleibend,
  anzahlAnfragen,
  views,
  appUrl = 'https://passare.ch',
  inseratId,
}: EmailInseratBaldAbgelaufenProps) {
  return (
    <Layout preview={`Dein Inserat läuft in ${tageVerbleibend} Tagen ab — verlängern?`}>
      <Headline>Dein Inserat läuft bald ab</Headline>

      <Paragraph>
        {verkaeuferName ? `${verkaeuferName}, dein` : 'Dein'} Inserat
        <strong> {inseratTitel}</strong> ist nur noch <strong>{tageVerbleibend} Tage</strong> sichtbar
        — bis am {abgelaufenAm}.
      </Paragraph>

      {(anzahlAnfragen !== undefined || views !== undefined) && (
        <InfoBox>
          {views !== undefined && (
            <Text style={metaStyle}><strong>Aufrufe bisher:</strong> {views}</Text>
          )}
          {anzahlAnfragen !== undefined && (
            <Text style={metaStyle}><strong>Anfragen:</strong> {anzahlAnfragen}</Text>
          )}
        </InfoBox>
      )}

      <Paragraph>
        Verlängere jetzt um weitere 90 Tage — die meisten Verkäufe brauchen 4–9 Monate
        bis zum Abschluss. Beim ersten Verlängern gibt's keinen Aufpreis fürs nochmalige
        Listing-Setup.
      </Paragraph>

      <Button href={`${appUrl}/dashboard/inserate/${inseratId}/verlaengern`}>
        Inserat verlängern
      </Button>

      <Caption>
        Nach Ablauf bleibt dein Inserat 30 Tage als Entwurf gespeichert. Eingegangene
        Anfragen kannst du dauerhaft im Dashboard abrufen.
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
