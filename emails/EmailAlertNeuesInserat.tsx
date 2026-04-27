/**
 * Email: Käufer-Alert bei neuem Match (passare MAX).
 */
import * as React from 'react';
import { Button, Caption, COLORS, Headline, InfoBox, Layout, Paragraph } from './_layout';
import { Text } from '@react-email/components';

export type EmailAlertNeuesInseratProps = {
  kaeuferName?: string;
  inseratTitel: string;
  branche?: string;
  kanton?: string;
  preisBand?: string;          // z.B. "1–3 Mio CHF"
  ebitda?: string;             // z.B. "ca. 450k CHF"
  matchScore?: number;         // 0–100
  suchprofilName?: string;     // welches Suchprofil hat den Match ausgelöst
  appUrl?: string;
  inseratId: string;
};

export default function EmailAlertNeuesInserat({
  kaeuferName,
  inseratTitel,
  branche,
  kanton,
  preisBand,
  ebitda,
  matchScore,
  suchprofilName,
  appUrl = 'https://passare.ch',
  inseratId,
}: EmailAlertNeuesInseratProps) {
  return (
    <Layout preview={`Neuer Match für dein Suchprofil: ${inseratTitel}`}>
      <Headline>Neues Inserat passt zu deinem Profil</Headline>

      <Paragraph>
        {kaeuferName ? `${kaeuferName}, ein` : 'Ein'} neues Inserat
        {suchprofilName ? ` matcht dein Suchprofil «${suchprofilName}»` : ' passt zu deinen Suchkriterien'}.
        {matchScore && matchScore >= 80 ? ' Das ist ein starker Match.' : ''}
      </Paragraph>

      <InfoBox>
        <Text style={titelStyle}>{inseratTitel}</Text>
        {branche && <Text style={metaStyle}><strong>Branche:</strong> {branche}</Text>}
        {kanton && <Text style={metaStyle}><strong>Kanton:</strong> {kanton}</Text>}
        {preisBand && <Text style={metaStyle}><strong>Preisband:</strong> {preisBand}</Text>}
        {ebitda && <Text style={metaStyle}><strong>EBITDA:</strong> {ebitda}</Text>}
        {matchScore !== undefined && (
          <Text style={{ ...metaStyle, color: COLORS.bronze, marginTop: 8 }}>
            <strong>Match-Score:</strong> {matchScore} / 100
          </Text>
        )}
      </InfoBox>

      <Button href={`${appUrl}/inserate/${inseratId}`}>Inserat ansehen</Button>

      <Caption>
        Du erhältst diese Email weil passare MAX aktiv ist. Häufigkeit und Schwellenwerte
        kannst du im Dashboard unter «Suchprofile» justieren.
      </Caption>
    </Layout>
  );
}

const titelStyle: React.CSSProperties = {
  fontFamily: '"Fraunces", Georgia, serif',
  fontSize: '18px',
  lineHeight: 1.3,
  color: COLORS.navy,
  margin: '0 0 12px 0',
  fontWeight: 500,
};

const metaStyle: React.CSSProperties = {
  fontFamily: '"Geist", "Inter", system-ui, sans-serif',
  fontSize: '14px',
  lineHeight: 1.6,
  color: COLORS.ink,
  margin: '0 0 4px 0',
};
