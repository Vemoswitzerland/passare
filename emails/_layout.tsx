/**
 * passare.ch — Shared Email-Layout
 *
 * Wrappt alle Email-Templates in das passare-Branding.
 * Mobile-responsive, Inline-Styles (Email-Client-kompatibel).
 *
 * Farben fix gehalten zu Tailwind-Tokens — kein Tailwind im Email-Render.
 */
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

// ─── Design-Tokens (gespiegelt aus tailwind.config.ts) ──────────
const COLORS = {
  ink:         '#0A0F12',
  navy:        '#0B1F3A',
  bronze:      '#B8935A',
  cream:       '#FAF8F3',
  paper:       '#FFFFFF',
  stone:       '#E8E6E0',
  quiet:       '#8A9099',
  muted:       '#5A6471',
  bronzeSoft:  '#E8DCC3',
};

const FONTS = {
  serif: '"Fraunces", "Tiempos", Georgia, serif',
  sans:  '"Geist", "Inter", system-ui, -apple-system, sans-serif',
};

// ─── Layout ─────────────────────────────────────────────────────
type LayoutProps = {
  preview: string;
  children: React.ReactNode;
};

export function Layout({ preview, children }: LayoutProps) {
  return (
    <Html lang="de">
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Logo */}
          <Section style={headerStyle}>
            <Text style={logoStyle}>passare.</Text>
          </Section>

          {/* Hairline */}
          <Hr style={hairlineStyle} />

          {/* Content */}
          <Section style={contentStyle}>{children}</Section>

          {/* Footer */}
          <Hr style={hairlineStyle} />
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              passare — Schweizer Marktplatz für Unternehmens­verkäufe
            </Text>
            <Text style={footerSmallStyle}>
              Vemo Switzerland · Zürich, Schweiz
            </Text>
            <Text style={footerSmallStyle}>
              <Link href="https://passare.ch/impressum" style={footerLinkStyle}>Impressum</Link>
              {' · '}
              <Link href="https://passare.ch/datenschutz" style={footerLinkStyle}>Datenschutz</Link>
              {' · '}
              <Link href="https://passare.ch/agb" style={footerLinkStyle}>AGB</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ─── Reusable Bits ──────────────────────────────────────────────
export function Headline({ children }: { children: React.ReactNode }) {
  return <Text style={headlineStyle}>{children}</Text>;
}

export function Paragraph({ children }: { children: React.ReactNode }) {
  return <Text style={paragraphStyle}>{children}</Text>;
}

export function Caption({ children }: { children: React.ReactNode }) {
  return <Text style={captionStyle}>{children}</Text>;
}

export function Button({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <table cellPadding={0} cellSpacing={0} role="presentation" style={{ margin: '24px 0' }}>
      <tbody>
        <tr>
          <td style={buttonOuterStyle}>
            <Link href={href} style={buttonStyle}>
              {children}
            </Link>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <Section style={infoBoxStyle}>
      {children}
    </Section>
  );
}

export { COLORS, FONTS };

// ─── Styles ─────────────────────────────────────────────────────
const bodyStyle: React.CSSProperties = {
  backgroundColor: COLORS.cream,
  fontFamily: FONTS.sans,
  margin: 0,
  padding: 0,
};

const containerStyle: React.CSSProperties = {
  backgroundColor: COLORS.paper,
  margin: '0 auto',
  maxWidth: '560px',
  padding: '0',
};

const headerStyle: React.CSSProperties = {
  padding: '32px 32px 16px 32px',
};

const logoStyle: React.CSSProperties = {
  fontFamily: FONTS.serif,
  fontSize: '28px',
  fontWeight: 600,
  color: COLORS.navy,
  letterSpacing: '-0.02em',
  margin: 0,
};

const hairlineStyle: React.CSSProperties = {
  borderColor: COLORS.stone,
  borderStyle: 'solid',
  borderWidth: '0.5px 0 0 0',
  margin: 0,
};

const contentStyle: React.CSSProperties = {
  padding: '32px',
};

const headlineStyle: React.CSSProperties = {
  fontFamily: FONTS.serif,
  fontSize: '24px',
  lineHeight: 1.25,
  letterSpacing: '-0.01em',
  color: COLORS.ink,
  margin: '0 0 16px 0',
  fontWeight: 500,
};

const paragraphStyle: React.CSSProperties = {
  fontFamily: FONTS.sans,
  fontSize: '15px',
  lineHeight: 1.6,
  color: COLORS.ink,
  margin: '0 0 16px 0',
};

const captionStyle: React.CSSProperties = {
  fontFamily: FONTS.sans,
  fontSize: '13px',
  lineHeight: 1.5,
  color: COLORS.muted,
  margin: '0 0 16px 0',
};

const buttonOuterStyle: React.CSSProperties = {
  borderRadius: '2px',
  backgroundColor: COLORS.navy,
};

const buttonStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '14px 28px',
  fontFamily: FONTS.sans,
  fontSize: '14px',
  fontWeight: 500,
  letterSpacing: '0.02em',
  color: COLORS.paper,
  textDecoration: 'none',
};

const infoBoxStyle: React.CSSProperties = {
  backgroundColor: COLORS.cream,
  border: `0.5px solid ${COLORS.stone}`,
  padding: '20px 24px',
  margin: '20px 0',
};

const footerStyle: React.CSSProperties = {
  padding: '24px 32px 32px 32px',
};

const footerTextStyle: React.CSSProperties = {
  fontFamily: FONTS.sans,
  fontSize: '12px',
  color: COLORS.muted,
  margin: '0 0 4px 0',
};

const footerSmallStyle: React.CSSProperties = {
  fontFamily: FONTS.sans,
  fontSize: '11px',
  color: COLORS.quiet,
  margin: '0 0 4px 0',
};

const footerLinkStyle: React.CSSProperties = {
  color: COLORS.quiet,
  textDecoration: 'underline',
};
