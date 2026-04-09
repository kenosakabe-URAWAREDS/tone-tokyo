import { NextRequest, NextResponse } from 'next/server';
import { sanityWrite } from '@/lib/sanity-write';

/**
 * Flip an article between draft and published. Sending
 * { id, action: 'publish' } sets status=published and stamps
 * publishedAt. { id, action: 'unpublish' } reverts to draft without
 * touching publishedAt (so the original first-publish date is
 * preserved if the editor re-publishes later).
 */
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { id, action } = data as { id?: string; action?: 'publish' | 'unpublish' };
    if (!id || !action) {
      return NextResponse.json(
        { error: 'id と action が必要です' },
        { status: 400 }
      );
    }
    if (action === 'publish') {
      await sanityWrite
        .patch(id)
        .set({ status: 'published', publishedAt: new Date().toISOString() })
        .commit();
    } else if (action === 'unpublish') {
      await sanityWrite.patch(id).set({ status: 'draft' }).commit();
    } else {
      return NextResponse.json({ error: 'action が不正です' }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('publish-article error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
