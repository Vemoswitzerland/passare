import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Minimaler Endpoint, um den Login-Status des aktuellen Users zu prüfen.
 * Wird vom Pre-Reg-Funnel-Step 5 genutzt um zu entscheiden, ob direkt
 * ins Inserat-Wizard oder zur Registrierung umgeleitet wird.
 */
export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({
    user: {
      id: data.user.id,
      email: data.user.email,
    },
  });
}
