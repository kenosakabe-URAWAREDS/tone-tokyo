import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/track-view
 *
 * Simple PV counter backed by Supabase. Each article page fires
 * this endpoint once on load. The Supabase table `page_views` has:
 *
 *   slug text not null,
 *   viewed_at timestamptz default now(),
 *   pillar text
 *
 * If Supabase isn't configured, this endpoint is a no-op.
 */
export async function POST(req: NextRequest) {
  try {
    const { slug, pillar } = await req.json();
    if (!slug) {
      return NextResponse.json({ error: 'slug required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ ok: true, tracked: false });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    await supabase.from('page_views').insert({ slug, pillar: pillar || null });

    return NextResponse.json({ ok: true, tracked: true });
  } catch (error) {
    // Non-critical — don't error out
    console.error('track-view error:', error);
    return NextResponse.json({ ok: true, tracked: false });
  }
}
