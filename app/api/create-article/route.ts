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

const SYSTEM_PROMPT = 'You are The Editor of TONE TOKYO, an English-language media about Japanese fashion, food, culture, and craft. You write from a first-person perspective as a Tokyo-based insider who travels the world and knows Japan deeply. Your voice is: specific not generic, opinionated but fair, insider casual, never touristy. Never use words like amazing, incredible, must-visit, hidden gem, off the beaten path, bucket list. Lead with a specific detail, end with practical info (address, hours, price). Explain Japanese terms naturally in context. Write 300-500 words. Output JSON with fields: title, subtitle, pillar (one of FASHION/EAT/CULTURE/EXPERIENCE/CRAFT), body (the article text), tags (array of strings), readTime (like "3 min read"), locationName (if applicable), locationNameJa (Japanese name if applicable). Return ONLY valid JSON, no markdown.';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 96);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const memo = formData.get('memo') as string;
    const images = formData.getAll('images') as File[];
    const secret = formData.get('secret') as string;

    if (secret !== process.env.INPUT_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const content: any[] = [];
    for (const image of images) {
      const buffer = Buffer.from(await image.arrayBuffer());
      const base64 = buffer.toString('base64');
      const mediaType = image.type || 'image/jpeg';
      content.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } });
    }
    content.push({ type: 'text', text: 'Write an article based on this input from The Editor: ' + memo });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content }],
    });

    const aiText = response.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('');
    const article = JSON.parse(aiText.replace(/`json|`/g, '').trim());
    const slug = slugify(article.title);

    const doc = await sanity.create({
      _type: 'article',
      title: article.title,
      slug: { _type: 'slug', current: slug },
      pillar: article.pillar,
      subtitle: article.subtitle,
      body: [{ _type: 'block', _key: 'body0', style: 'normal', children: [{ _type: 'span', _key: 'span0', text: article.body }] }],
      tags: article.tags,
      readTime: article.readTime,
      locationName: article.locationName || '',
      locationNameJa: article.locationNameJa || '',
      sourceType: 'kentaro-initiated',
      publishedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, title: article.title, id: doc._id });
  } catch (error: any) {
    console.error('Create article error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
