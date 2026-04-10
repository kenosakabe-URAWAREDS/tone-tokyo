import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/cron/generate-newsletter
 *
 * Vercel Cron Job — runs every Monday at 0:00 UTC (9:00 JST).
 * Triggers newsletter generation via the /api/newsletter endpoint.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Call the newsletter generate endpoint
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
    const res = await fetch(`${baseUrl}/api/newsletter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'generate' }),
    });

    const data = await res.json();
    return NextResponse.json({ ok: true, ...data });
  } catch (error) {
    console.error('cron/generate-newsletter error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
