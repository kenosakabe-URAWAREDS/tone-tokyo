import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { sanityWrite } from '@/lib/sanity-write';
import { EDITOR_DRAFT_JA_SYSTEM_PROMPT } from '@/lib/editor-prompt';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const VALID_PILLARS = new Set([
  'FASHION',
  'EAT',
  'CULTURE',
  'EXPERIENCE',
  'CRAFT',
  'FAMILY',
]);

async function fetchUrlContent(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ToneTokyo/1.0)' },
      redirect: 'follow',
    });
    const html = await res.text();
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 2500);
  } catch {
    return '';
  }
}

async function urlToBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.toString('base64');
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const {
      stockpileId,
      memo,
      additionalImages,
      googleMapsUrl,
      tabelogUrl,
      officialUrl,
      referenceUrls,
      pillar,
      isJapaneseAbroad,
      city,
      country,
    } = data as {
      stockpileId?: string;
      memo?: string;
      additionalImages?: string[];
      googleMapsUrl?: string;
      tabelogUrl?: string;
      officialUrl?: string;
      referenceUrls?: string[];
      pillar?: string;
      isJapaneseAbroad?: boolean;
      city?: string;
      country?: string;
    };

    if (!memo && !stockpileId) {
      return NextResponse.json(
        { error: 'memo または stockpileId が必要です' },
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

    // Pull image asset URLs from the stockpile (if any) so Claude can
    // see what the LINE bot captured.
    let stockpileImageUrls: string[] = [];
    let stockpileMemo = '';
    if (stockpileId) {
      const stockpile = await sanityWrite.fetch<{
        memo?: string;
        images?: Array<{ url?: string }>;
      } | null>(
        `*[_type == "stockpile" && _id == $id][0] {
          memo,
          "images": images[] { "url": asset->url }
        }`,
        { id: stockpileId }
      );
      if (stockpile) {
        stockpileMemo = stockpile.memo || '';
        stockpileImageUrls = (stockpile.images || [])
          .map((i) => i.url)
          .filter(Boolean) as string[];
      }
    }

    const finalMemo = (memo || stockpileMemo || '').trim();

    // Optional URL context.
    let urlContext = '';
    if (googleMapsUrl) {
      const c = await fetchUrlContent(googleMapsUrl);
      if (c) urlContext += '\n\n[Google Maps info]:\n' + c;
    }
    if (tabelogUrl) {
      const c = await fetchUrlContent(tabelogUrl);
      if (c) urlContext += '\n\n[Tabelog info]:\n' + c;
    }
    if (officialUrl) {
      const c = await fetchUrlContent(officialUrl);
      if (c) urlContext += '\n\n[公式サイト情報]: コンセプト、メニュー、価格帯、シェフ/デザイナー情報を参考に:\n' + c;
    }
    if (Array.isArray(referenceUrls)) {
      for (const refUrl of referenceUrls.filter(Boolean)) {
        const c = await fetchUrlContent(refUrl);
        if (c) urlContext += `\n\n[参考情報] ${refUrl}:\n` + c;
      }
    }

    let promptText = `[LOCKED PILLAR — エディターが pillar: ${lockedPillar} を選択。出力では必ずこの pillar を反映し、覆さないこと。]

The Editor のメモ:

${finalMemo || '(メモなし — 写真と URL から判断)'}`;

    if (isJapaneseAbroad) {
      promptText += `\n\n[JAPANESE ABROAD: YES]\n- City: ${city || ''}\n- Country: ${country || ''}`;
    }

    if (googleMapsUrl) promptText += '\n\nGoogle Maps URL: ' + googleMapsUrl;
    if (tabelogUrl) promptText += '\n\nTabelog URL: ' + tabelogUrl;
    if (officialUrl) promptText += '\n\n公式サイト URL: ' + officialUrl;
    if (urlContext)
      promptText +=
        '\n\nURL から取得した参考情報 (事実だけ抜き、レビュー文の逐語コピー禁止):' +
        urlContext;

    // Build the multi-part content array for Claude.
    type AnthropicContent =
      | { type: 'text'; text: string }
      | {
          type: 'image';
          source: { type: 'base64'; media_type: string; data: string };
        };
    const content: AnthropicContent[] = [];

    for (const url of stockpileImageUrls.slice(0, 4)) {
      const b64 = await urlToBase64(url);
      if (b64) {
        content.push({
          type: 'image',
          source: { type: 'base64', media_type: 'image/jpeg', data: b64 },
        });
      }
    }

    if (Array.isArray(additionalImages)) {
      for (const img of additionalImages.slice(0, 4)) {
        const base64 = img.replace(/^data:image\/\w+;base64,/, '');
        content.push({
          type: 'image',
          source: { type: 'base64', media_type: 'image/jpeg', data: base64 },
        });
      }
    }

    content.push({ type: 'text', text: promptText });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      system: EDITOR_DRAFT_JA_SYSTEM_PROMPT,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages: [{ role: 'user', content: content as any }],
    });

    const aiText = response.content
      .filter((b) => b.type === 'text')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((b) => (b as any).text)
      .join('');

    let draft;
    try {
      draft = JSON.parse(aiText.replace(/```json|```/g, '').trim());
    } catch {
      console.error('Failed to parse AI JSON output:', aiText);
      return NextResponse.json(
        { error: 'AI のレスポンスを JSON として解釈できませんでした' },
        { status: 500 }
      );
    }

    // Lock pillar + abroad fields server-side regardless of what the
    // model returned.
    draft.pillar = lockedPillar;
    if (typeof isJapaneseAbroad === 'boolean') {
      draft.isJapaneseAbroad = isJapaneseAbroad;
      if (isJapaneseAbroad) {
        if (city) draft.city = city;
        if (country) draft.country = country;
      } else {
        draft.city = '';
        draft.country = '';
      }
    }

    return NextResponse.json({ ok: true, draft });
  } catch (error) {
    console.error('generate-article error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
