import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/analytics?period=7d|30d|all
 *
 * Aggregates PV data from the Supabase `page_views` table.
 * Returns daily PV counts, top articles, pillar breakdown,
 * and newsletter subscriber count.
 */
export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const period = req.nextUrl.searchParams.get('period') || '7d';

    let since: string;
    const now = new Date();
    if (period === '30d') {
      since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    } else if (period === 'all') {
      since = '2020-01-01T00:00:00Z';
    } else {
      since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }

    // Fetch raw views in the period
    const { data: views, error: viewsError } = await supabase
      .from('page_views')
      .select('slug, pillar, viewed_at')
      .gte('viewed_at', since)
      .order('viewed_at', { ascending: true });

    if (viewsError) {
      console.error('analytics query error:', viewsError);
      return NextResponse.json({ error: viewsError.message }, { status: 500 });
    }

    const rows = views || [];

    // Daily PV counts
    const dailyMap = new Map<string, number>();
    for (const row of rows) {
      const day = row.viewed_at?.slice(0, 10) || 'unknown';
      dailyMap.set(day, (dailyMap.get(day) || 0) + 1);
    }
    const dailyPV = Array.from(dailyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top articles by PV
    const slugMap = new Map<string, { count: number; pillar?: string }>();
    for (const row of rows) {
      if (!row.slug) continue;
      const existing = slugMap.get(row.slug) || { count: 0, pillar: row.pillar };
      existing.count++;
      slugMap.set(row.slug, existing);
    }
    const topArticles = Array.from(slugMap.entries())
      .map(([slug, data]) => ({ slug, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Pillar breakdown
    const pillarMap = new Map<string, number>();
    for (const row of rows) {
      const p = row.pillar || 'Unknown';
      pillarMap.set(p, (pillarMap.get(p) || 0) + 1);
    }
    const pillarBreakdown = Array.from(pillarMap.entries())
      .map(([pillar, count]) => ({ pillar, count }))
      .sort((a, b) => b.count - a.count);

    // Newsletter subscriber count
    let subscriberCount = 0;
    try {
      const { count } = await supabase
        .from('newsletter_subscribers')
        .select('*', { count: 'exact', head: true });
      subscriberCount = count || 0;
    } catch {
      // table might not exist
    }

    return NextResponse.json({
      totalPV: rows.length,
      dailyPV,
      topArticles,
      pillarBreakdown,
      subscriberCount,
    });
  } catch (error) {
    console.error('analytics error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
