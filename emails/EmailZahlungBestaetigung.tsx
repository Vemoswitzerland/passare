/**
 * Email: Zahlungsbestätigung nach Stripe-Checkout.
 */
import * as React from 'react';
import { Button, Caption, COLORS, Headline, InfoBox, Layout, Paragraph } from './_layout';
import { Text } from '@react-email/components';

export type EmailZahlungBestaetigungProps = {
  empfaengerName?: string;
  produkt: string;            // z.B. "Inserat-Veröffentlichung 90 Tage" oder "passare MAX Jahresabo"
  betrag: string;             // formatiert "CHF 990.00"
  rechnungsNr?: string;
  rechnungsUrl?: string;      // Stripe Hosted Invoice URL
  zahlungsdatum: string;      // "27. April 2026"
  appUrl?: string;
};

export default function EmailZahlungBestaetigung({
  empfaengerName,
  produkt,
  betrag,
  rechnungsNr,
  rechnungsUrl,
  zahlungsdatum,
  appUrl = 'https://passare.ch',
}: EmailZahlungBestaetigungProps) {
  return (
    <Layout preview={`Zahlung bestätigt: ${produkt} — ${betrag}`}>
      <Headline>Zahlung erfolgreich</Headline>

      <Paragraph>
        {empfaengerName ? `${empfaengerName}, vielen` : 'Vielen'} Dank für deine
        Zahlung. Sie wurde erfolgreich verbucht.
      </Paragraph>

      <InfoBox>
        <Text style={metaStyle}><strong>Produkt:</strong> {produkt}</Text>
        <Text style={metaStyle}><strong>Betrag:</strong> {betrag}</Text>
        <Text style={metaStyle}><strong>Datum:</strong> {zahlungsdatum}</Text>
        {rechnungsNr && (
          <Text style={metaStyle}><strong>Rechnungs-Nr.:</strong> {rechnungsNr}</Text>
        )}
      </InfoBox>

      {rechnungsUrl ? (
        <Button href={rechnungsUrl}>Rechnung herunterladen</Button>
      ) : (
        <Button href={`${appUrl}/dashboard`}>Zum Dashboard</Button>
      )}

      <Paragraph>
        Dein Inserat / Abo ist ab sofort aktiv. Im Dashboard siehst du Status,
        Restlaufzeit und kannst alle Rechnungen zentral abrufen.
      </Paragraph>

      <Caption>
        Stripe verarbeitet alle Zahlungen — wir sehen keine Karten- oder Kontodaten.
        Bei Fragen zur Rechnung: einfach auf diese Email antworten.
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
