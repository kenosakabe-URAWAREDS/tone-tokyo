import { NextResponse } from 'next/server';
import { createClient } from 'next-sanity';

const sanity = createClient({
  projectId: 'w757ks40',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
});

/**
 * GET /api/photos/groups
 *
 * Returns groups of photos aggregated by groupId.
 */
export async function GET() {
  try {
    // Fetch all photos with a groupId, then group client-side
    // (GROQ doesn't support GROUP BY natively)
    const photos = await sanity.fetch(`
      *[_type == "photo" && defined(groupId)] | order(takenAt desc) {
        _id,
        "imageUrl": image.asset->url,
        takenAt,
        placeName,
        placeNameJa,
        area,
        groupId,
        isRecommended
      }
    `);

    const groupMap = new Map<string, any>();
    for (const p of photos) {
      if (!p.groupId) continue;
      if (!groupMap.has(p.groupId)) {
        groupMap.set(p.groupId, {
          groupId: p.groupId,
          placeName: p.placeName,
          placeNameJa: p.placeNameJa,
          area: p.area,
          coverImageUrl: p.imageUrl,
          photoCount: 0,
          latestDate: p.takenAt,
          photos: [],
        });
      }
      const group = groupMap.get(p.groupId)!;
      group.photoCount++;
      group.photos.push(p);
    }

    // Also include ungrouped photos
    const ungrouped = await sanity.fetch(`
      count(*[_type == "photo" && !defined(groupId)])
    `);

    const groups = Array.from(groupMap.values())
      .sort((a, b) => (b.latestDate || '').localeCompare(a.latestDate || ''));

    return NextResponse.json({ groups, ungroupedCount: ungrouped });
  } catch (error) {
    console.error('photos/groups error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
