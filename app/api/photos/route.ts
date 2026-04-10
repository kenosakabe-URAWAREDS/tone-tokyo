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
 * GET /api/photos
 *
 * Query params:
 *   search — filter by placeName or area (case-insensitive match)
 *   groupId — filter by group
 *   limit — page size (default 50)
 *   offset — pagination offset (default 0)
 */
export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl;
    const search = url.searchParams.get('search') || '';
    const groupId = url.searchParams.get('groupId') || '';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    let filter = `_type == "photo"`;
    const params: Record<string, any> = {};

    if (search) {
      filter += ` && (placeName match $search || area match $search || placeNameJa match $search)`;
      params.search = `*${search}*`;
    }
    if (groupId) {
      filter += ` && groupId == $groupId`;
      params.groupId = groupId;
    }

    const query = `{
      "photos": *[${filter}] | order(takenAt desc, uploadedAt desc) [$offset...$end] {
        _id,
        "imageUrl": image.asset->url,
        takenAt,
        latitude,
        longitude,
        placeName,
        placeNameJa,
        googlePlaceId,
        area,
        groupId,
        cameraModel,
        isRecommended,
        uploadedAt,
        source,
        fileSize,
        "usedInArticleId": usedInArticle->_id,
        "assetRef": image.asset->_id
      },
      "total": count(*[${filter}])
    }`;

    params.offset = offset;
    params.end = offset + limit;

    const data = await sanity.fetch(query, params);
    return NextResponse.json(data);
  } catch (error) {
    console.error('photos list error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
