import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'next-sanity';
import Anthropic from '@anthropic-ai/sdk';

const sanity = createClient({
  projectId: 'w757ks40',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
});

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * POST /api/photos/recommend
 *
 * Body: { groupId: string }
 *
 * Uses Claude Vision to analyze photos in a group and recommend
 * the best shots for an article (max 3). Updates isRecommended
 * on the selected photos.
 */
export async function POST(req: NextRequest) {
  try {
    const { groupId } = await req.json();
    if (!groupId) {
      return NextResponse.json({ error: 'groupId required' }, { status: 400 });
    }

    // Fetch photos in this group (max 10 for cost optimization)
    const photos = await sanity.fetch(
      `*[_type == "photo" && groupId == $groupId] | order(takenAt asc) [0...10] {
        _id,
        "imageUrl": image.asset->url
      }`,
      { groupId }
    );

    if (photos.length < 3) {
      return NextResponse.json({
        error: 'Need at least 3 photos in a group for recommendations',
      }, { status: 400 });
    }

    // Build vision content blocks
    const imageBlocks: any[] = [];
    for (const photo of photos) {
      if (!photo.imageUrl) continue;
      imageBlocks.push({
        type: 'image',
        source: { type: 'url', url: photo.imageUrl + '?w=800&q=70&auto=format' },
      });
      imageBlocks.push({
        type: 'text',
        text: `Photo ID: ${photo._id}`,
      });
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: [
            ...imageBlocks,
            {
              type: 'text',
              text: `You are a photo editor for TONE TOKYO, a lifestyle magazine about Japan.

Analyze these photos and select the best 3 for use in an article. Consider:
- Good composition (subject well-framed, no blur)
- Appropriate brightness
- Full subject visible (not cut off)
- Variety of angles (don't pick similar shots)

Return ONLY a JSON array of the 3 best photo IDs, in order of preference. Example:
["id1", "id2", "id3"]

Return the JSON array and nothing else.`,
            },
          ],
        },
      ],
    });

    // Parse the AI response
    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    let recommendedIds: string[] = [];
    try {
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        recommendedIds = JSON.parse(match[0]);
      }
    } catch {
      console.error('Failed to parse AI recommendation:', text);
      return NextResponse.json({ error: 'AI response parse failed' }, { status: 500 });
    }

    // Clear previous recommendations in this group
    const allInGroup = await sanity.fetch(
      `*[_type == "photo" && groupId == $groupId && isRecommended == true]._id`,
      { groupId }
    );
    for (const id of allInGroup) {
      await sanity.patch(id).set({ isRecommended: false }).commit();
    }

    // Set new recommendations
    for (const id of recommendedIds) {
      try {
        await sanity.patch(id).set({ isRecommended: true }).commit();
      } catch (e) {
        console.error('Failed to mark recommended:', id, e);
      }
    }

    return NextResponse.json({ ok: true, recommended: recommendedIds });
  } catch (error) {
    console.error('photos/recommend error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
