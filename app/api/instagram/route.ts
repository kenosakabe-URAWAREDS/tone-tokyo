import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'next-sanity';
import Anthropic from '@anthropic-ai/sdk';
import { processImageForInstagram } from '@/lib/image-processor';

const sanity = createClient({
  projectId: 'w757ks40',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
});

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * POST /api/instagram
 *
 * Body: { articleId: string, action: 'generate' | 'send' }
 *
 * - generate: Creates an IG caption from the article and returns
 *   the caption + square-cropped hero image as base64.
 * - send: Sends to Buffer API (if BUFFER_ACCESS_TOKEN is set).
 */
export async function POST(req: NextRequest) {
  try {
    const { articleId, action, caption: manualCaption } = await req.json();
    if (!articleId) {
      return NextResponse.json({ error: 'articleId required' }, { status: 400 });
    }

    const article = await sanity.fetch(
      `*[_type == "article" && _id == $id][0]{
        title, subtitle, body, pillar, tags,
        "heroImageUrl": coalesce(heroImage.asset->url, heroImageUrl),
        locationName, area, neighborhood
      }`,
      { id: articleId }
    );

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    if (action === 'generate') {
      // Generate caption with Claude
      const bodyText = typeof article.body === 'string'
        ? article.body.slice(0, 500)
        : Array.isArray(article.body)
          ? article.body
              .filter((b: any) => b._type === 'block')
              .map((b: any) => b.children?.map((c: any) => c.text).join('') || '')
              .join(' ')
              .slice(0, 500)
          : '';

      const captionResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: `Generate an Instagram caption for a TONE TOKYO article.

Title: ${article.title}
Subtitle: ${article.subtitle || ''}
Pillar: ${article.pillar}
Location: ${article.locationName || ''}, ${article.area || ''}
Body excerpt: ${bodyText}
Tags: ${(article.tags || []).join(', ')}

Requirements:
- 150-200 characters for the main caption
- Conversational, insider tone (not promotional)
- Add 8-12 relevant hashtags (#tokyo #japan etc.)
- End with: "Link in bio for the full story"
- No emojis in the main text. Emojis OK in hashtags line.

Return ONLY the caption text, no explanation.`,
          },
        ],
      });

      const caption = captionResponse.content[0].type === 'text'
        ? captionResponse.content[0].text
        : '';

      // Generate square-cropped image
      let squareImageBase64: string | undefined;
      if (article.heroImageUrl) {
        try {
          const imgRes = await fetch(article.heroImageUrl + '?w=1200&q=85');
          const imgBuf = Buffer.from(await imgRes.arrayBuffer());
          const square = await processImageForInstagram(imgBuf);
          squareImageBase64 = `data:image/jpeg;base64,${square.toString('base64')}`;
        } catch (e) {
          console.error('IG image processing failed:', e);
        }
      }

      return NextResponse.json({ ok: true, caption, squareImageBase64 });
    }

    if (action === 'send') {
      const bufferToken = process.env.BUFFER_ACCESS_TOKEN;
      if (!bufferToken) {
        return NextResponse.json({
          error: 'BUFFER_ACCESS_TOKEN not configured. Use copy/download instead.',
        }, { status: 503 });
      }

      // Get Buffer profiles
      const profilesRes = await fetch('https://api.bufferapp.com/1/profiles.json', {
        headers: { Authorization: `Bearer ${bufferToken}` },
      });
      const profiles = await profilesRes.json();
      const igProfile = profiles.find((p: any) =>
        p.service === 'instagram' && !p.disabled
      );

      if (!igProfile) {
        return NextResponse.json({ error: 'No active Instagram profile in Buffer' }, { status: 400 });
      }

      // Schedule post (30 min from now)
      const scheduledAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      const caption = manualCaption || '';

      const createRes = await fetch('https://api.bufferapp.com/1/updates/create.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Bearer ${bufferToken}`,
        },
        body: new URLSearchParams({
          text: caption,
          profile_ids: igProfile.id,
          scheduled_at: scheduledAt,
          ...(article.heroImageUrl ? { 'media[photo]': article.heroImageUrl } : {}),
        }),
      });
      const result = await createRes.json();

      return NextResponse.json({ ok: true, buffer: result });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('instagram error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
