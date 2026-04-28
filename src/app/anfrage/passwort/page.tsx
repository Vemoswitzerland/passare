import { Suspense } from 'react';
import { SiteHeader, SiteFooter } from '../../page';
import { verifyAnfrageToken } from '@/lib/anfrage-token';
import { InvalidTokenScreen, PasswortClient } from './PasswortClient';

/**
 * /anfrage/passwort?token=… — letzter Schritt im Anfrage-Flow.
 *
 * Server-Component validiert den signierten Token, übergibt das Payload an
 * den Client (Form). Bei ungültigem/abgelaufenem Token: InvalidTokenScreen.
 */

export const metadata = {
  title: 'Konto aktivieren — passare',
  description: 'Letzter Schritt: Passwort setzen und Anfrage abschicken.',
  robots: { index: false, follow: false },
};

type Params = {
  searchParams: Promise<{ token?: string }>;
};

export default async function AnfragePasswortPage({ searchParams }: Params) {
  const { token } = await searchParams;
  const payload = token ? verifyAnfrageToken(token) : null;

  return (
    <main className="min-h-screen flex flex-col bg-cream">
      <SiteHeader />
      <Suspense fallback={null}>
        {payload && token ? (
          <PasswortClient
            token={token}
            payload={{
              name: payload.n,
              email: payload.e,
              listingId: payload.l,
            }}
          />
        ) : (
          <InvalidTokenScreen />
        )}
      </Suspense>
      <SiteFooter />
    </main>
  );
}
