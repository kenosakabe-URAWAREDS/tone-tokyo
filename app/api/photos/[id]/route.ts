import { NextRequest, NextResponse } from 'next/server';
import { sanityWrite } from '@/lib/sanity-write';

/**
 * DELETE /api/photos/[id]
 * PATCH  /api/photos/[id]
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await sanityWrite.delete(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('photos/delete error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Allow updating: placeName, placeNameJa, googlePlaceId, area, groupId
    const allowed = ['placeName', 'placeNameJa', 'googlePlaceId', 'area', 'groupId'];
    const set: Record<string, any> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) {
        set[key] = body[key];
      }
    }

    if (Object.keys(set).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    await sanityWrite.patch(id).set(set).commit();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('photos/patch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
