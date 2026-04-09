import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'next-sanity';
import Anthropic from '@anthropic-ai/sdk';
import { createHash } from 'node:crypto';
import { EDITOR_SYSTEM_PROMPT } from '@/lib/editor-prompt';

const sanity = createClient({
  projectId: 'w757ks40',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
});

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const LINE_CHANNEL_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';

// =====================================================================
// LINE plumbing
// =====================================================================

async function getLineContent(messageId: string): Promise<Buffer> {
  const res = await fetch(
    'https://api-data.line.me/v2/bot/message/' + messageId + '/content',
    { headers: { Authorization: 'Bearer ' + LINE_CHANNEL_TOKEN } }
  );
  return Buffer.from(await res.arrayBuffer());
}

async function replyToLine(replyToken: string, text: string) {
  await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + LINE_CHANNEL_TOKEN,
    },
    body: JSON.stringify({ replyToken, messages: [{ type: 'text', text }] }),
  });
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 96);
}

function extractUrls(text: string) {
  const googleMapsRegex =
    /https?:\/\/(maps\.google\.com|goo\.gl\/maps|google\.com\/maps|maps\.app\.goo\.gl)[^\s]*/g;
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
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 2000);
  } catch {
    return '';
  }
}

// =====================================================================
// Session helpers — one Sanity doc per LINE user
// =====================================================================

type LineSession = {
  _id: string;
  _type: 'lineSession';
  userId: string;
  state: 'awaiting-pillar' | 'collecting';
  pillar?: 'FASHION' | 'EAT' | 'CULTURE' | 'EXPERIENCE' | 'CRAFT' | 'FAMILY';
  answers?: string[];
  imageAsset?: { _type: 'image'; asset: { _type: 'reference'; _ref: string } };
  googleMapsUrl?: string;
  tabelogUrl?: string;
  officialUrl?: string;
  updatedAt?: string;
};

function sessionIdFor(userId: string): string {
  // Deterministic, stable, fits Sanity's doc ID rules.
  const hash = createHash('sha256').update(userId).digest('hex').slice(0, 24);
  return `lineSession-${hash}`;
}

async function loadSession(userId: string): Promise<LineSession | null> {
  const doc = await sanity.getDocument<LineSession>(sessionIdFor(userId));
  return doc ?? null;
}

async function deleteSession(userId: string) {
  try {
    await sanity.delete(sessionIdFor(userId));
  } catch {
    // session might already be gone — that's fine
  }
}

// =====================================================================
// Pillar parsing
// =====================================================================

const PILLAR_LIST: Array<LineSession['pillar']> = [
  'FASHION',
  'EAT',
  'CULTURE',
  'EXPERIENCE',
  'CRAFT',
  'FAMILY',
];

function parsePillar(text: string): LineSession['pillar'] | null {
  const t = text.trim().toLowerCase();
  // Numeric: "1" → Fashion, "2" → Eat, etc.
  const numMatch = t.match(/^([1-6])\b/);
  if (numMatch) return PILLAR_LIST[Number(numMatch[1]) - 1];
  // English keyword
  if (t.startsWith('fashion')) return 'FASHION';
  if (t.startsWith('eat') || t.startsWith('food')) return 'EAT';
  if (t.startsWith('culture')) return 'CULTURE';
  if (t.startsWith('experience')) return 'EXPERIENCE';
  if (t.startsWith('craft')) return 'CRAFT';
  if (t.startsWith('family')) return 'FAMILY';
  // Japanese
  if (t.includes('ファッション') || t.includes('服') || t.includes('fashion'))
    return 'FASHION';
  if (t.includes('食') || t.includes('飯') || t.includes('レストラン')) return 'EAT';
  if (t.includes('カルチャー') || t.includes('文化') || t.includes('音楽'))
    return 'CULTURE';
  if (t.includes('体験') || t.includes('エクスペリエンス')) return 'EXPERIENCE';
  if (t.includes('クラフト') || t.includes('工芸') || t.includes('職人'))
    return 'CRAFT';
  if (t.includes('ファミリー') || t.includes('家族') || t.includes('子連れ') || t.includes('子供'))
    return 'FAMILY';
  return null;
}

const FINISH_MARKERS = ['おわり', '終わり', 'おわる', 'end', 'done', '完了', 'ok'];
function isFinish(text: string): boolean {
  const t = text.trim().toLowerCase();
  return FINISH_MARKERS.some((m) => t === m || t === m + '。' || t === m + '！');
}

// =====================================================================
// Pillar question prompts (sent to user after they pick a pillar)
// =====================================================================

const PILLAR_PROMPTS: Record<NonNullable<LineSession['pillar']>, string> = {
  EAT: [
    'EAT を選びました。以下の質問に答えてください（全部じゃなくてもOK、わかる範囲で）:',
    '',
    '・店名は？',
    '・場所（エリア）は？',
    '・何を食べた？おすすめは？',
    '・価格帯は？',
    '・一言コメント',
    '',
    '答え終わったら「おわり」と送ってください。',
  ].join('\n'),
  FASHION: [
    'FASHION を選びました。以下の質問に答えてください（全部じゃなくてもOK）:',
    '',
    '・ブランド名 / 店名は？',
    '・何が特徴？',
    '・誰向け？',
    '・価格帯は？',
    '・一言コメント',
    '',
    '答え終わったら「おわり」と送ってください。',
  ].join('\n'),
  CULTURE: [
    'CULTURE を選びました。以下の質問に答えてください（全部じゃなくてもOK）:',
    '',
    '・名前 / 場所は？',
    '・何が特徴？',
    '・いつ行った？',
    '・誰向け？',
    '・一言コメント',
    '',
    '答え終わったら「おわり」と送ってください。',
  ].join('\n'),
  EXPERIENCE: [
    'EXPERIENCE を選びました。以下の質問に答えてください（全部じゃなくてもOK）:',
    '',
    '・名前 / 場所は？',
    '・何が特徴？',
    '・いつ行った？',
    '・誰向け？',
    '・一言コメント',
    '',
    '答え終わったら「おわり」と送ってください。',
  ].join('\n'),
  CRAFT: [
    'CRAFT を選びました。以下の質問に答えてください（全部じゃなくてもOK）:',
    '',
    '・名前 / 場所は？',
    '・何が特徴？',
    '・いつ行った？',
    '・誰向け？',
    '・一言コメント',
    '',
    '答え終わったら「おわり」と送ってください。',
  ].join('\n'),
  FAMILY: [
    'FAMILY を選びました。以下の質問に答えてください（全部じゃなくてもOK）:',
    '',
    '・名前 / 場所は？',
    '・何が特徴？（ベビーカーOK・室内・芝生・授乳室など）',
    '・想定する子供の年齢は？',
    '・誰向け？',
    '・一言コメント',
    '',
    '答え終わったら「おわり」と送ってください。',
  ].join('\n'),
};

const PILLAR_PICKER_TEXT =
  '写真を受け取りました📸\n\nどのピラー？番号で答えてください:\n\n1. Fashion\n2. Eat\n3. Culture\n4. Experience\n5. Craft\n6. Family';

// =====================================================================
// Article generation (called when user sends "おわり")
// =====================================================================

async function generateAndPublishArticle(
  session: LineSession,
  replyToken: string
) {
  // Re-fetch the image asset metadata so we can pass the binary to Claude.
  // (We could also pass the asset ID and let Claude fetch via URL but the
  // existing pipeline gives Claude the bytes directly, so we match that.)
  let imageBase64 = '';
  if (session.imageAsset?.asset?._ref) {
    try {
      const assetDoc = await sanity.getDocument<{ url?: string }>(
        session.imageAsset.asset._ref
      );
      if (assetDoc?.url) {
        const buf = Buffer.from(await (await fetch(assetDoc.url)).arrayBuffer());
        imageBase64 = buf.toString('base64');
      }
    } catch (e) {
      console.error('Failed to fetch session image asset:', e);
    }
  }

  // Compose a structured prompt from the answers.
  const answersText = (session.answers || []).filter(Boolean).join('\n- ');
  const pillarText = session.pillar || 'unknown';

  let promptText = `[LOCKED PILLAR — the editor has explicitly chosen pillar: ${pillarText}. Use this pillar in your output. Do not override.]

The editor sent the following over LINE:

- ${answersText || '(no text answers — work from the photo only)'}`;

  // Optional URL context (rare via LINE flow but supported).
  let urlContext = '';
  if (session.googleMapsUrl) {
    const c = await fetchUrlContent(session.googleMapsUrl);
    if (c) urlContext += '\n\n[Google Maps info]:\n' + c;
    promptText += '\n\nGoogle Maps URL: ' + session.googleMapsUrl;
  }
  if (session.tabelogUrl) {
    const c = await fetchUrlContent(session.tabelogUrl);
    if (c) urlContext += '\n\n[Tabelog info]:\n' + c;
    promptText += '\n\nTabelog URL: ' + session.tabelogUrl;
  }
  if (urlContext)
    promptText +=
      '\n\nReference information from URLs (use for accuracy, do NOT copy reviews):' +
      urlContext;

  const content: Array<{ type: string; [key: string]: unknown }> = [];
  if (imageBase64) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 },
    });
  }
  content.push({ type: 'text', text: promptText });

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: EDITOR_SYSTEM_PROMPT,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: [{ role: 'user', content: content as any }],
  });

  const aiText = response.content
    .filter((b) => b.type === 'text')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((b) => (b as any).text)
    .join('');

  type AIArticle = {
    title: string;
    titleJa?: string;
    subtitle?: string;
    pillar?: string;
    body: string;
    tags?: string[];
    readTime?: string;
    locationName?: string;
    locationNameJa?: string;
    address?: string;
    priceRange?: string;
  };

  let article: AIArticle;
  try {
    article = JSON.parse(aiText.replace(/```json|```/g, '').trim());
  } catch {
    await replyToLine(replyToken, '❌ AI generation failed. Please retry.');
    return;
  }

  // Force the locked pillar server-side.
  if (session.pillar) article.pillar = session.pillar;

  const slug = slugify(article.title);

  await sanity.create({
    _type: 'article',
    title: article.title,
    titleJa: article.titleJa || '',
    slug: { _type: 'slug', current: slug },
    pillar: article.pillar,
    subtitle: article.subtitle,
    heroImage: session.imageAsset || undefined,
    body: [
      {
        _type: 'block',
        _key: 'body0',
        style: 'normal',
        children: [{ _type: 'span', _key: 'span0', text: article.body }],
      },
    ],
    tags: article.tags,
    readTime: article.readTime,
    locationName: article.locationName || '',
    locationNameJa: article.locationNameJa || '',
    googleMapsUrl: session.googleMapsUrl || '',
    tabelogUrl: session.tabelogUrl || '',
    officialUrl: session.officialUrl || '',
    address: article.address || '',
    priceRange: article.priceRange || '',
    sourceType: 'kentaro-initiated',
    publishedAt: new Date().toISOString(),
  });

  await deleteSession(session.userId);

  await replyToLine(
    replyToken,
    `📝 記事を作成しました\n\n🇬🇧 ${article.title}\n🇯🇵 ${article.titleJa || ''}\n\ntone-tokyo.com/article/${slug}`
  );
}

// =====================================================================
// Webhook handler — state machine entry point
// =====================================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const events = body.events || [];

    for (const event of events) {
      if (event.type !== 'message') continue;
      const userId = event.source?.userId;
      if (!userId) continue;

      const messageType = event.message.type;
      const session = await loadSession(userId);

      // -----------------------------------------------------------
      // Branch 1: incoming photo
      // -----------------------------------------------------------
      if (messageType === 'image') {
        // Upload photo to Sanity assets immediately so we don't have
        // to keep base64 in the session doc.
        const buf = await getLineContent(event.message.id);
        const asset = await sanity.assets.upload('image', buf, {
          filename: `line-${userId.slice(-8)}-${Date.now()}.jpg`,
          contentType: 'image/jpeg',
        });
        const imageAsset = {
          _type: 'image' as const,
          asset: { _type: 'reference' as const, _ref: asset._id },
        };

        // Reset/create the session in awaiting-pillar state. A photo
        // always restarts the flow — simplest UX.
        await sanity.createOrReplace({
          _id: sessionIdFor(userId),
          _type: 'lineSession',
          userId,
          state: 'awaiting-pillar',
          imageAsset,
          answers: [],
          updatedAt: new Date().toISOString(),
        });

        await replyToLine(event.replyToken, PILLAR_PICKER_TEXT);
        continue;
      }

      // -----------------------------------------------------------
      // Branch 2: text without an active session
      // -----------------------------------------------------------
      if (messageType !== 'text') continue;
      const text: string = event.message.text;

      if (!session) {
        await replyToLine(
          event.replyToken,
          'まず写真を1枚送ってください📸\nピラーを聞いてから記事生成に進みます。'
        );
        continue;
      }

      // -----------------------------------------------------------
      // Branch 3: awaiting-pillar — parse pillar from text
      // -----------------------------------------------------------
      if (session.state === 'awaiting-pillar') {
        const pillar = parsePillar(text);
        if (!pillar) {
          await replyToLine(
            event.replyToken,
            '番号 (1-6) かピラー名で答えてください:\n1. Fashion\n2. Eat\n3. Culture\n4. Experience\n5. Craft\n6. Family'
          );
          continue;
        }

        await sanity
          .patch(sessionIdFor(userId))
          .set({
            state: 'collecting',
            pillar,
            updatedAt: new Date().toISOString(),
          })
          .commit();

        await replyToLine(event.replyToken, PILLAR_PROMPTS[pillar]);
        continue;
      }

      // -----------------------------------------------------------
      // Branch 4: collecting — accumulate answers, watch for "おわり"
      // -----------------------------------------------------------
      if (session.state === 'collecting') {
        if (isFinish(text)) {
          // Re-fetch the session in case any patches were lost in flight.
          const fresh = (await loadSession(userId)) || session;
          await replyToLine(event.replyToken, '⏳ 記事を生成中...');
          await generateAndPublishArticle(fresh, event.replyToken);
          continue;
        }

        // Accumulate. Strip URLs into separate fields if recognized.
        const { googleMapsUrls, tabelogUrls, cleanText } = extractUrls(text);
        const patch = sanity.patch(sessionIdFor(userId));
        const nextAnswers = [...(session.answers || [])];
        if (cleanText) nextAnswers.push(cleanText);
        patch.set({ answers: nextAnswers, updatedAt: new Date().toISOString() });
        if (googleMapsUrls[0]) patch.set({ googleMapsUrl: googleMapsUrls[0] });
        if (tabelogUrls[0]) patch.set({ tabelogUrl: tabelogUrls[0] });
        await patch.commit();

        await replyToLine(
          event.replyToken,
          `✓ 受け取りました (${nextAnswers.length}件)\nまだあれば続けて、終わったら「おわり」と送ってください。`
        );
        continue;
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
