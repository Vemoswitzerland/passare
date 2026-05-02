import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('broker_profiles')
    .select('*')
    .eq('id', userData.user.id)
    .maybeSingle();

  return NextResponse.json({ profile });
}
