import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Supabase-Redirect-Ziel für Bestätigungs- und Recovery-E-Mails.
 *
 * Akzeptiert sowohl `?code=…` (PKCE-Flow) als auch `?token_hash=…&type=…`
 * (klassischer OTP-Flow), tauscht in eine Session und leitet weiter.
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);

  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type'); // signup | recovery | invite | magiclink | email_change
  const next = searchParams.get('next') ?? '';

  const supabase = await createClient();

  // PKCE-Flow
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error.message)}`);
  }
  // OTP/Token-Hash-Flow
  else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'signup' | 'recovery' | 'invite' | 'magiclink' | 'email_change',
    });
    if (error) return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error.message)}`);
  } else {
    return NextResponse.redirect(`${origin}/auth/login?error=invalid_callback`);
  }

  // Weiterleitung je nach Typ
  if (type === 'recovery') {
    return NextResponse.redirect(`${origin}/auth/reset/confirm`);
  }
  return NextResponse.redirect(`${origin}${next || '/dashboard'}`);
}
