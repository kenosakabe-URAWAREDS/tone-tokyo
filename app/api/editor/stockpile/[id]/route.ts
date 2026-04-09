import { NextRequest, NextResponse } from 'next/server';
import { sanityWrite } from '@/lib/sanity-write';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const stockpile = await sanityWrite.fetch(
      `*[_type == "stockpile" && _id == $id][0] {
        _id,
        memo,
        receivedAt,
        source,
        status,
        googleMapsUrl,
        tabelogUrl,
        "images": images[] {
          _key,
          "url": asset->url,
          "assetRef": asset._ref
        }
      }`,
      { id }
    );
    if (!stockpile) {
      return NextResponse.json({ error: 'Stockpile not found' }, { status: 404 });
    }
    return NextResponse.json(stockpile);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await sanityWrite.delete(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
