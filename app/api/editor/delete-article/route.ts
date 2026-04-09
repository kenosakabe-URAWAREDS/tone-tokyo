import { NextRequest, NextResponse } from 'next/server';
import { sanityWrite } from '@/lib/sanity-write';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { id } = data as { id?: string };
    if (!id) {
      return NextResponse.json({ error: 'id が必要です' }, { status: 400 });
    }
    await sanityWrite.delete(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('delete-article error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
