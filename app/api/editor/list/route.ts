import { NextResponse } from 'next/server';
import { sanityWrite } from '@/lib/sanity-write';

/**
 * Powers the /editor dashboard. One round-trip returns all three
 * tabs (stockpile / drafts / published) so the client can switch
 * tabs without refetching.
 */
export async function GET() {
  try {
    // The write client (token attached) is used so unpublished
    // drafts are visible — the public client would only see
    // status==published.
    const [stockpiles, drafts, published] = await Promise.all([
      sanityWrite.fetch(
        `*[_type == "stockpile" && status == "new"] | order(receivedAt desc) [0..49] {
          _id,
          memo,
          receivedAt,
          source,
          googleMapsUrl,
          tabelogUrl,
          "thumb": images[0].asset->url,
          "imageCount": count(images)
        }`
      ),
      sanityWrite.fetch(
        `*[_type == "article" && (status == "draft" || status == "scheduled")] | order(_updatedAt desc) [0..49] {
          _id,
          title,
          titleJa,
          "slug": slug.current,
          pillar,
          status,
          scheduledAt,
          _updatedAt,
          publishedAt,
          "thumb": coalesce(heroImage.asset->url, heroImageUrl)
        }`
      ),
      sanityWrite.fetch(
        `*[_type == "article" && (status == "published" || !defined(status))] | order(publishedAt desc) [0..99] {
          _id,
          title,
          titleJa,
          "slug": slug.current,
          pillar,
          publishedAt,
          "thumb": coalesce(heroImage.asset->url, heroImageUrl)
        }`
      ),
    ]);

    return NextResponse.json({
      stockpiles,
      drafts,
      published,
    });
  } catch (error) {
    console.error('editor/list error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
