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

const SYSTEM_PROMPT = `You are The Editor of TONE TOKYO, an English-language media about Japanese fashion, food, culture, and craft. You write from a first-person perspective as a Tokyo-based insider who travels the world and knows Japan deeply. Your voice is: specific not generic, opinionated but fair, insider casual, never touristy. Never use words like amazing, incredible, must-visit, hidden gem, off the beaten path, bucket list. Lead with a specific detail, end with practical info (address, hours, price). Explain Japanese terms naturally in context. Write 300-500 words.

When Google Maps or Tabelog URLs are provided, use the extracted information (address, hours, rating, menu items, price range, reviews) to make the article more accurate and detailed. Do NOT copy reviews verbatim - use them only as reference for factual details like popular dishes, atmosphere, and practical tips.

Output JSON with fields: title, subtitle, pillar (one of FASHION/EAT/CULTURE/EXPERIENCE/CRAFT), body (the article text as a single string), tags (array of strings), readTime (like "3 min read"), locationName (English name), locationNameJa (Japanese name if applicable), titleJa (Japanese title for review purposes), address (full address if available), hours (business hours if available), priceRange (e.g. "¥1,000-2,000"). Return ONLY valid JSON, no markdown.`;

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

function extractUrls(text: string) {
  const googleMapsRegex = /https?:\/\/(maps\.google\.com|goo\.gl\/maps|google\.com\/maps|maps\.app\.goo\.gl)[^\s]*/g;
  const tabelogRegex = /https?:\/\/(tabelog\.com|s\.tabelog\.com)[^\s]*/g;
  const googleMapsUrls = text.match(googleMapsRegex) || [];
  const tabelogUrls = text.match(tabelogRegex) || [];
  const cleanText = text
    .replace(googleMapsRegex, '')
    .replace(tabelogRegex, '')
    .replace(/https?:\/\/[^\s]+/g, '')
    .trim();
  return { googleMapsUrls, tabelogUrls, cleanText };
}

async function fetchUrlContent(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ToneTokyo/1.0)' },
      redirect: 'follow',
    });
    const html = await res.text();
    // Extract text content, limit to 2000 chars for API context
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

      // Extract URLs from message
      const { googleMapsUrls, tabelogUrls, cleanText } = extractUrls(userText);

      // Fetch additional context from URLs
      let urlContext = '';
      for (const url of googleMapsUrls) {
        const content = await fetchUrlContent(url);
        if (content) urlContext += '\n\n[Google Maps info]:\n' + content;
      }
      for (const url of tabelogUrls) {
        const content = await fetchUrlContent(url);
        if (content) urlContext += '\n\n[Tabelog info]:\n' + content;
      }

      // Build prompt
      let promptText = 'Write an article based on this input from The Editor:\n\n' + cleanText;
      if (googleMapsUrls.length > 0) promptText += '\n\nGoogle Maps URL: ' + googleMapsUrls.join(', ');
      if (tabelogUrls.length > 0) promptText += '\n\nTabelog URL: ' + tabelogUrls.join(', ');
      if (urlContext) promptText += '\n\nReference information from URLs (use for accuracy, do NOT copy reviews):' + urlContext;

      const messages: any[] = [];
      const content: any[] = [];
      if (imageBase64) {
        content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } });
      }
      content.push({ type: 'text', text: promptText });
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
        article = JSON.parse(aiText.replace(/```json|```/g, '').trim());
      } catch {
        await replyToLine(event.replyToken, 'AI generation failed. Please try again.');
        continue;
      }

      const slug = slugify(article.title);

      await sanity.create({
        _type: 'article',
        title: article.title,
        titleJa: article.titleJa || '',
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

      await replyToLine(event.replyToken, '📝 記事を作成しました\n\n🇬🇧 ' + article.title + '\n🇯🇵 ' + (article.titleJa || '') + '\n\ntone-tokyo.com/article/' + slug);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
