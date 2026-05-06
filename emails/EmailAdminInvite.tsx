/**
 * Email: Admin-Invite — wenn ein Admin via /admin/users jemanden einlädt.
 */
import * as React from 'react';
import { Button, Caption, Headline, Layout, Paragraph } from './_layout';

export type EmailAdminInviteProps = {
  inviteUrl: string;
  rolle: 'admin' | 'verkaeufer' | 'kaeufer' | 'broker';
  invitedByName?: string;
};

const ROLLE_LABEL: Record<EmailAdminInviteProps['rolle'], string> = {
  admin: 'Administrator/in',
  broker: 'Broker/in',
  verkaeufer: 'Verkäufer/in',
  kaeufer: 'Käufer/in',
};

export default function EmailAdminInvite({
  inviteUrl,
  rolle,
  invitedByName = 'Das passare-Team',
}: EmailAdminInviteProps) {
  const rolleLabel = ROLLE_LABEL[rolle];

  return (
    <Layout preview={`${invitedByName} hat dich zu passare eingeladen.`}>
      <Headline>Du wurdest zu passare eingeladen.</Headline>

      <Paragraph>
        <strong>{invitedByName}</strong> hat dich als <strong>{rolleLabel}</strong> auf
        die passare-Plattform eingeladen.
      </Paragraph>

      <Paragraph>
        Klicke den Knopf, um dein Konto zu aktivieren. Der Link ist 14 Tage gültig.
      </Paragraph>

      <Button href={inviteUrl}>Einladung annehmen</Button>

      <Caption>
        Du erwartest keine Einladung? Dann ignoriere diese E-Mail einfach — ohne Klick
        passiert nichts.
      </Caption>
    </Layout>
  );
}
