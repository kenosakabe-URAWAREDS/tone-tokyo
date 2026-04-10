import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'next-sanity';

const sanity = createClient({
  projectId: 'w757ks40',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
});

/**
 * GET /api/cron/publish-scheduled
 *
 * Vercel Cron Job — runs every hour. Finds articles with
 * status='scheduled' and scheduledAt <= now(), flips them to
 * 'published' and sets publishedAt = scheduledAt.
 */
export async function GET(req: NextRequest) {
  // Verify cron secret in production
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date().toISOString();
    const articles = await sanity.fetch(
      `*[_type == "article" && status == "scheduled" && scheduledAt <= $now]{
        _id, scheduledAt
      }`,
      { now }
    );

    let published = 0;
    for (const article of articles) {
      try {
        await sanity
          .patch(article._id)
          .set({
            status: 'published',
            publishedAt: article.scheduledAt || now,
          })
          .unset(['scheduledAt'])
          .commit();
        published++;
      } catch (e) {
        console.error('Failed to publish scheduled article:', article._id, e);
      }
    }

    return NextResponse.json({ ok: true, published, checked: articles.length });
  } catch (error) {
    console.error('cron/publish-scheduled error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
