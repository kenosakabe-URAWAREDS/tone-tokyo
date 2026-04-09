import { NextRequest, NextResponse } from 'next/server';
import { sanityWrite } from '@/lib/sanity-write';

type SanityImageRef = {
  _type: 'image';
  _key: string;
  asset: { _type: 'reference'; _ref: string };
};

/**
 * Editor save endpoint. Accepts the article id plus the editable
 * fields and patches Sanity. Image handling is keyed on
 * `gallery[]` and `heroAssetRef`:
 *
 * - Existing images are passed back as `{assetRef}` so we re-build
 *   the Sanity image reference array without re-uploading.
 * - Newly added images come in as base64 in `newImages[]` and are
 *   uploaded to Sanity assets here, then appended to the gallery
 *   array. The first image overall becomes hero (unless the editor
 *   explicitly set heroAssetRef).
 *
 * The editor controls slot order client-side; we just persist
 * whatever order they sent.
 */
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const {
      id,
      title,
      titleJa,
      subtitle,
      body,
      bodyJa,
      pillar,
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
      isJapaneseAbroad,
      city,
      country,
      gallery,
      newImages,
      heroAssetRef,
    } = data as {
      id?: string;
      title?: string;
      titleJa?: string;
      subtitle?: string;
      body?: string;
      bodyJa?: string;
      pillar?: string;
      tags?: string[];
      readTime?: string;
      locationName?: string;
      locationNameJa?: string;
      address?: string;
      phone?: string;
      hours?: string;
      priceRange?: string;
      googleMapsUrl?: string;
      tabelogUrl?: string;
      websiteUrl?: string;
      isJapaneseAbroad?: boolean;
      city?: string;
      country?: string;
      gallery?: Array<{ assetRef: string }>;
      newImages?: string[];
      heroAssetRef?: string;
    };

    if (!id) {
      return NextResponse.json({ error: 'id が必要です' }, { status: 400 });
    }

    // Reassemble the gallery array from existing refs + freshly
    // uploaded base64 images. Order matters: hero is the first item.
    const imageRefs: SanityImageRef[] = [];
    if (Array.isArray(gallery)) {
      gallery.forEach((g, i) => {
        if (g?.assetRef) {
          imageRefs.push({
            _type: 'image',
            _key: `g${i}-${g.assetRef.slice(-6)}`,
            asset: { _type: 'reference', _ref: g.assetRef },
          });
        }
      });
    }
    if (Array.isArray(newImages)) {
      for (let i = 0; i < newImages.length; i++) {
        try {
          const base64 = newImages[i].replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64, 'base64');
          const asset = await sanityWrite.assets.upload('image', buffer, {
            filename: `editor-update-${Date.now()}-${i}.jpg`,
            contentType: 'image/jpeg',
          });
          imageRefs.push({
            _type: 'image',
            _key: `new${i}-${asset._id.slice(-6)}`,
            asset: { _type: 'reference', _ref: asset._id },
          });
        } catch (e) {
          console.error('newImages upload failed:', e);
        }
      }
    }

    // Hero is whichever image's assetRef matches heroAssetRef, falling
    // back to the first item.
    let heroRef = imageRefs[0];
    if (heroAssetRef) {
      const match = imageRefs.find((r) => r.asset._ref === heroAssetRef);
      if (match) heroRef = match;
    }
    const heroImage = heroRef
      ? { _type: 'image' as const, asset: heroRef.asset }
      : undefined;
    const galleryRefs = imageRefs.filter((r) => r !== heroRef);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const set: Record<string, any> = {};
    if (typeof title === 'string') set.title = title;
    if (typeof titleJa === 'string') set.titleJa = titleJa;
    if (typeof subtitle === 'string') set.subtitle = subtitle;
    if (typeof body === 'string') set.body = body;
    if (typeof bodyJa === 'string') set.bodyJa = bodyJa;
    if (typeof pillar === 'string') set.pillar = pillar;
    if (Array.isArray(tags)) set.tags = tags;
    if (typeof readTime === 'string') set.readTime = readTime;
    if (typeof locationName === 'string') set.locationName = locationName;
    if (typeof locationNameJa === 'string') set.locationNameJa = locationNameJa;
    if (typeof address === 'string') set.address = address;
    if (typeof phone === 'string') set.phone = phone;
    if (typeof hours === 'string') set.hours = hours;
    if (typeof priceRange === 'string') set.priceRange = priceRange;
    if (typeof googleMapsUrl === 'string') set.googleMapsUrl = googleMapsUrl;
    if (typeof tabelogUrl === 'string') set.tabelogUrl = tabelogUrl;
    if (typeof websiteUrl === 'string') {
      set.websiteUrl = websiteUrl;
      set.officialUrl = websiteUrl;
    }
    if (typeof isJapaneseAbroad === 'boolean') {
      set.isJapaneseAbroad = isJapaneseAbroad;
      set.city = isJapaneseAbroad ? city || '' : '';
      set.country = isJapaneseAbroad ? country || '' : '';
    }

    if (heroImage) set.heroImage = heroImage;
    set.gallery = galleryRefs.length ? galleryRefs : null;

    await sanityWrite.patch(id).set(set).commit();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('update-article error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
