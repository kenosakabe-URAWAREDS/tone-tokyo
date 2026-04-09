import { NextRequest, NextResponse } from 'next/server';
import { sanityWrite } from '@/lib/sanity-write';

const ARTICLE_PROJECTION = `{
  _id,
  _updatedAt,
  title,
  titleJa,
  "slug": slug.current,
  pillar,
  subtitle,
  body,
  bodyJa,
  status,
  publishedAt,
  "heroImage": coalesce(heroImage.asset->url, heroImageUrl),
  "heroImageRef": heroImage,
  "heroAssetRef": heroImage.asset._ref,
  "gallery": gallery[] {
    _key,
    "url": asset->url,
    "assetRef": asset._ref,
    alt,
    caption
  },
  tags,
  readTime,
  locationName,
  locationNameJa,
  address,
  phone,
  hours,
  priceRange,
  googleMapsUrl,
  tabelogUrl,
  websiteUrl,
  officialUrl,
  isJapaneseAbroad,
  city,
  country
}`;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const article = await sanityWrite.fetch(
      `*[_type == "article" && _id == $id][0] ${ARTICLE_PROJECTION}`,
      { id }
    );
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }
    return NextResponse.json(article);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
