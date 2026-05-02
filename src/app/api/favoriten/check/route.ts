import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Check ob ein Inserat aktuell vom eingeloggten Käufer gemerkt ist.
 * Wird vom Like-Button initial geladen damit der Heart-State stimmt.
 */
export async function GET(req: NextRequest) {
  const inserat_id = req.nextUrl.searchParams.get('inserat_id');
  if (!inserat_id) return NextResponse.json({ liked: false });

  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return NextResponse.json({ liked: false });

  const { data } = await supabase
    .from('favoriten')
    .select('inserat_id')
    .eq('kaeufer_id', u.user.id)
    .eq('inserat_id', inserat_id)
    .maybeSingle();

  return NextResponse.json({ liked: !!data });
}
