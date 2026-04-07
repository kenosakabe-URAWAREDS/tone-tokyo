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

const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || '';
const LINE_CHANNEL_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';

async function getLineContent(messageId: string): Promise<Buffer> {
  const res = await fetch('https://api-data.line.me/v2/bot/message/' + messageId + '/content', {
    headers: { Authorization: 'Bearer ' + LINE_CHANNEL_TOKEN },
  });
  return Buffer.from(await res.arrayBuffer());
}

async function replyToLine(replyToken: string, text: string) {
  await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + LINE_CHANNEL_TOKEN },
    body: JSON.stringify({ replyToken, messages: [{ type: 'text', text }] }),
  });
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 96);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const events = body.events || [];

    for (const event of events) {
      if (event.type !== 'message') continue;

      let userText = '';
      let imageBase64 = '';

      if (event.message.type === 'text') {
        userText = event.message.text;
      } else if (event.message.type === 'image') {
        const buf = await getLineContent(event.message.id);
        imageBase64 = buf.toString('base64');
        userText = 'Photo sent with no caption';
      }

      if (!userText && !imageBase64) continue;

      const messages: any[] = [];
      const content: any[] = [];
      if (imageBase64) {
        content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } });
      }
      content.push({ type: 'text', text: 'Write an article based on this input from The Editor: ' + userText });
      messages.push({ role: 'user', content });

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages,
      });

      const aiText = response.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('');
      let article;
      try {
        article = JSON.parse(aiText.replace(/`json|`/g, '').trim());
      } catch {
        await replyToLine(event.replyToken, 'AI generation failed. Please try again.');
        continue;
      }

      const slug = slugify(article.title);

      await sanity.create({
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

      await replyToLine(event.replyToken, 'Draft created: "' + article.title + '"\n\nReview at tone-tokyo.com/studio');
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
