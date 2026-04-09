import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { sanityWrite } from '@/lib/sanity-write';
import { EDITOR_TRANSLATE_SYSTEM_PROMPT } from '@/lib/editor-prompt';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const VALID_PILLARS = new Set([
  'FASHION',
  'EAT',
  'CULTURE',
  'EXPERIENCE',
  'CRAFT',
  'FAMILY',
]);

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 96) || `article-${Date.now()}`;
}

type SanityImageRef = {
  _type: 'image';
  _key: string;
  asset: { _type: 'reference'; _ref: string };
};

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const {
      jaTitle,
      jaSubtitle,
      jaBody,
      tags,
      readTime,
      locationName,
      locationNameJa,
      pillar,
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
      stockpileId,
      additionalImages,
    } = data as {
      jaTitle?: string;
      jaSubtitle?: string;
      jaBody?: string;
      tags?: string[];
      readTime?: string;
      locationName?: string;
      locationNameJa?: string;
      pillar?: string;
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
      stockpileId?: string;
      additionalImages?: string[];
    };

    if (!jaTitle || !jaBody) {
      return NextResponse.json(
        { error: 'jaTitle と jaBody は必須です' },
        { status: 400 }
      );
    }

    const lockedPillar =
      typeof pillar === 'string' && VALID_PILLARS.has(pillar.toUpperCase())
        ? pillar.toUpperCase()
        : null;
    if (!lockedPillar) {
      return NextResponse.json({ error: 'pillar が不正です' }, { status: 400 });
    }

    // Step 1: ask Claude to translate the JA draft into English in
    // The Editor's voice. Single round-trip returning JSON for title /
    // subtitle / body.
    const translateInput = `Translate the following Japanese article into English, in The Editor's voice.

[日本語タイトル]
${jaTitle}

[日本語サブタイトル]
${jaSubtitle || ''}

[日本語本文]
${jaBody}

Respond with the JSON object specified in the system prompt.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system: EDITOR_TRANSLATE_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: [{ type: 'text', text: translateInput }] }],
    });

    const aiText = response.content
      .filter((b) => b.type === 'text')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((b) => (b as any).text)
      .join('');

    let translated: { title: string; subtitle: string; body: string };
    try {
      translated = JSON.parse(aiText.replace(/```json|```/g, '').trim());
    } catch {
      console.error('Failed to parse translation JSON:', aiText);
      return NextResponse.json(
        { error: '翻訳結果を JSON として解釈できませんでした' },
        { status: 500 }
      );
    }

    if (!translated.title || !translated.body) {
      return NextResponse.json(
        { error: '翻訳結果が不完全です (title / body 欠落)' },
        { status: 500 }
      );
    }

    // Step 2: gather images. Carry over the stockpile's existing
    // image refs (no re-upload) and append any newly uploaded
    // base64 images from the editor.
    const imageRefs: SanityImageRef[] = [];

    if (stockpileId) {
      const stockpile = await sanityWrite.fetch<{
        images?: Array<{ assetRef?: string }>;
      } | null>(
        `*[_type == "stockpile" && _id == $id][0] {
          "images": images[] { "assetRef": asset._ref }
        }`,
        { id: stockpileId }
      );
      if (stockpile?.images) {
        stockpile.images.forEach((img, i) => {
          if (img.assetRef) {
            imageRefs.push({
              _type: 'image',
              _key: `sp${i}-${img.assetRef.slice(-6)}`,
              asset: { _type: 'reference', _ref: img.assetRef },
            });
          }
        });
      }
    }

    if (Array.isArray(additionalImages)) {
      for (let i = 0; i < additionalImages.length; i++) {
        try {
          const base64 = additionalImages[i].replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64, 'base64');
          const asset = await sanityWrite.assets.upload('image', buffer, {
            filename: `editor-${Date.now()}-${i}.jpg`,
            contentType: 'image/jpeg',
          });
          imageRefs.push({
            _type: 'image',
            _key: `add${i}-${asset._id.slice(-6)}`,
            asset: { _type: 'reference', _ref: asset._id },
          });
        } catch (e) {
          console.error('additionalImages upload failed:', e);
        }
      }
    }

    const heroImage = imageRefs[0]
      ? { _type: 'image' as const, asset: imageRefs[0].asset }
      : undefined;
    const gallery = imageRefs.length > 1 ? imageRefs.slice(1) : undefined;

    const slug = slugify(translated.title);

    // Step 3: write the draft article. Status starts at 'draft' so
    // it appears in the Drafts tab and is hidden from the public site
    // until the editor explicitly publishes.
    const doc = await sanityWrite.create({
      _type: 'article',
      title: translated.title,
      titleJa: jaTitle,
      slug: { _type: 'slug', current: slug },
      pillar: lockedPillar,
      subtitle: translated.subtitle || '',
      heroImage,
      gallery,
      body: translated.body,
      bodyJa: jaBody,
      tags: Array.isArray(tags) ? tags : [],
      readTime: readTime || '',
      locationName: locationName || '',
      locationNameJa: locationNameJa || '',
      address: address || '',
      phone: phone || '',
      hours: hours || '',
      priceRange: priceRange || '',
      googleMapsUrl: googleMapsUrl || '',
      tabelogUrl: tabelogUrl || '',
      websiteUrl: websiteUrl || '',
      officialUrl: websiteUrl || '',
      isJapaneseAbroad: Boolean(isJapaneseAbroad),
      city: isJapaneseAbroad ? city || '' : '',
      country: isJapaneseAbroad ? country || '' : '',
      sourceType: 'kentaro-initiated',
      status: 'draft',
    });

    // Step 4: mark the source stockpile used so it disappears from
    // the inbox tab.
    if (stockpileId) {
      try {
        await sanityWrite.patch(stockpileId).set({ status: 'used' }).commit();
      } catch (e) {
        console.error('failed to mark stockpile used:', e);
      }
    }

    return NextResponse.json({
      ok: true,
      id: doc._id,
      slug,
      title: translated.title,
    });
  } catch (error) {
    console.error('translate-and-save error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
