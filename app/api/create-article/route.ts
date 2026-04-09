import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'next-sanity';
import Anthropic from '@anthropic-ai/sdk';
import { EDITOR_SYSTEM_PROMPT } from '@/lib/editor-prompt';

const sanity = createClient({
  projectId: 'w757ks40',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
});

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const VALID_PILLARS = new Set(['FASHION', 'EAT', 'CULTURE', 'EXPERIENCE', 'CRAFT']);

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 96);
}

async function fetchUrlContent(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ToneTokyo/1.0)' },
      redirect: 'follow',
    });
    const html = await res.text();
    const textOnly = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 2000);
    return textOnly;
  } catch {
    return '';
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { memo, images, googleMapsUrl, tabelogUrl, officialUrl, pillar } = data;

    if (!memo && (!images || images.length === 0)) {
      return NextResponse.json({ error: 'Memo or image required' }, { status: 400 });
    }

    // Validate caller-supplied pillar hint (optional). When present
    // we lock the AI's pillar choice via an explicit prompt prefix.
    const lockedPillar: string | null =
      typeof pillar === 'string' && VALID_PILLARS.has(pillar.toUpperCase())
        ? pillar.toUpperCase()
        : null;

    // Fetch additional context from URLs
    let urlContext = '';
    if (googleMapsUrl) {
      const content = await fetchUrlContent(googleMapsUrl);
      if (content) urlContext += '\n\n[Google Maps info]:\n' + content;
    }
    if (tabelogUrl) {
      const content = await fetchUrlContent(tabelogUrl);
      if (content) urlContext += '\n\n[Tabelog info]:\n' + content;
    }

    // Build prompt
    let promptText = 'Write an article based on this input from The Editor:\n\n' + (memo || '');
    if (lockedPillar) {
      promptText =
        `[LOCKED PILLAR — the editor has explicitly chosen pillar: ${lockedPillar}. ` +
        `Use this pillar in your output. Do not override.]\n\n` +
        promptText;
    }
    if (googleMapsUrl) promptText += '\n\nGoogle Maps URL: ' + googleMapsUrl;
    if (tabelogUrl) promptText += '\n\nTabelog URL: ' + tabelogUrl;
    if (urlContext) promptText += '\n\nReference information from URLs (use for accuracy, do NOT copy reviews):' + urlContext;

    const content: any[] = [];
    if (images && images.length > 0) {
      for (const img of images) {
        const base64 = img.replace(/^data:image\/\w+;base64,/, '');
        content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } });
      }
    }
    content.push({ type: 'text', text: promptText });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: EDITOR_SYSTEM_PROMPT,
      messages: [{ role: 'user', content }],
    });

    const aiText = response.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('');
    let article;
    try {
      article = JSON.parse(aiText.replace(/```json|```/g, '').trim());
    } catch {
      return NextResponse.json({ error: 'AI generation failed' }, { status: 500 });
    }

    // Belt-and-suspenders: even if the model ignores the locked
    // pillar prompt prefix, force the field server-side.
    if (lockedPillar) {
      article.pillar = lockedPillar;
    }

    const slug = slugify(article.title);

    // Upload first image to Sanity as heroImage
    let heroImageAsset: any = null;
  const galleryAssets: any[] = [];
  if (images && images.length > 0) {
    for (let i = 0; i < images.length; i++) {
      try {
        const base64 = images[i].replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64, "base64");
        const asset = await sanity.assets.upload("image", buffer, { filename: slug + "-" + i + ".jpg", contentType: "image/jpeg" });
        if (i === 0) { heroImageAsset = asset; } else { galleryAssets.push(asset); }
      } catch (e) {
        console.error("Image upload failed:", e);
      }
    }
  }

    const doc = await sanity.create({
      _type: 'article',
      title: article.title,
      titleJa: article.titleJa || '',
      slug: { _type: 'slug', current: slug },
      pillar: article.pillar,
      subtitle: article.subtitle,
      heroImage: heroImageAsset ? { _type: "image", asset: { _type: "reference", _ref: heroImageAsset._id } } : undefined,
      gallery: galleryAssets.length > 0 ? galleryAssets.map((a, i) => ({ _type: "image", _key: "img" + i, asset: { _type: "reference", _ref: a._id } })) : undefined,
      body: [{ _type: 'block', _key: 'body0', style: 'normal', children: [{ _type: 'span', _key: 'span0', text: article.body }] }],
      tags: article.tags,
      readTime: article.readTime,
      locationName: article.locationName || '',
      locationNameJa: article.locationNameJa || '',
      officialUrl: officialUrl || '',
      googleMapsUrl: googleMapsUrl || '',
      tabelogUrl: tabelogUrl || '',
      address: article.address || '',
      priceRange: article.priceRange || '',
      sourceType: 'kentaro-initiated',
      publishedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, title: article.title, titleJa: article.titleJa || '', id: doc._id, slug });
  } catch (error: any) {
    console.error('Create article error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

