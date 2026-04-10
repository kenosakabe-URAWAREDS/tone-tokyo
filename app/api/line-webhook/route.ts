import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'next-sanity';
import { processImage } from '@/lib/image-processor';

/**
 * LINE webhook — capture-only mode.
 *
 * Old behaviour was a multi-turn state machine that asked for a
 * pillar, collected answers, then ran Claude inline. That blew the
 * webhook timeout and the bot would hang on "記事を生成中". The new
 * flow is dumb on purpose:
 *
 *   1. Receive text or photo from LINE.
 *   2. Save it as a `stockpile` doc in Sanity.
 *   3. Reply once with "保存しました — /editor で確認" and stop.
 *
 * AI generation is now triggered manually from /editor instead of
 * inside the webhook, so timeouts are no longer possible here.
 *
 * Batching: a single LINE webhook POST can carry multiple events
 * (text + photo together). We group all messages from the same user
 * in this batch into one stockpile so a "photo + caption" pair lands
 * as one inbox item rather than two.
 */

const sanity = createClient({
  projectId: 'w757ks40',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
});

const LINE_CHANNEL_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';

async function getLineContent(messageId: string): Promise<Buffer> {
  const res = await fetch(
    'https://api-data.line.me/v2/bot/message/' + messageId + '/content',
    { headers: { Authorization: 'Bearer ' + LINE_CHANNEL_TOKEN } }
  );
  return Buffer.from(await res.arrayBuffer());
}

async function replyToLine(replyToken: string, text: string) {
  try {
    await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + LINE_CHANNEL_TOKEN,
      },
      body: JSON.stringify({ replyToken, messages: [{ type: 'text', text }] }),
    });
  } catch (e) {
    console.error('LINE reply failed:', e);
  }
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
    .trim();
  return {
    googleMapsUrl: googleMapsUrls[0] || '',
    tabelogUrl: tabelogUrls[0] || '',
    cleanText,
  };
}

type SanityImageRef = {
  _type: 'image';
  _key: string;
  asset: { _type: 'reference'; _ref: string };
};

type LineEvent = {
  type: string;
  replyToken?: string;
  source?: { userId?: string };
  message: { type: string; id: string; text?: string };
};

type Bucket = {
  userId: string;
  replyToken: string;
  memoParts: string[];
  imageMessageIds: string[];
  googleMapsUrl: string;
  tabelogUrl: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const events: LineEvent[] = body.events || [];

    // Group all message events in this batch by userId so a photo +
    // its caption arriving together end up in one stockpile doc.
    const buckets = new Map<string, Bucket>();
    for (const event of events) {
      if (event.type !== 'message') continue;
      const userId = event.source?.userId;
      if (!userId) continue;
      const replyToken = event.replyToken || '';
      if (!buckets.has(userId)) {
        buckets.set(userId, {
          userId,
          replyToken,
          memoParts: [],
          imageMessageIds: [],
          googleMapsUrl: '',
          tabelogUrl: '',
        });
      }
      const bucket = buckets.get(userId)!;
      // First reply token wins; LINE rejects reuse so just take one.
      if (!bucket.replyToken && replyToken) bucket.replyToken = replyToken;

      if (event.message.type === 'text' && event.message.text) {
        const { googleMapsUrl, tabelogUrl, cleanText } = extractUrls(
          event.message.text
        );
        if (cleanText) bucket.memoParts.push(cleanText);
        if (googleMapsUrl && !bucket.googleMapsUrl) bucket.googleMapsUrl = googleMapsUrl;
        if (tabelogUrl && !bucket.tabelogUrl) bucket.tabelogUrl = tabelogUrl;
      } else if (event.message.type === 'image') {
        bucket.imageMessageIds.push(event.message.id);
      }
    }

    // Persist each bucket as a single stockpile doc.
    for (const bucket of buckets.values()) {
      try {
        const imageRefs: SanityImageRef[] = [];
        for (let i = 0; i < bucket.imageMessageIds.length; i++) {
          const messageId = bucket.imageMessageIds[i];
          try {
            const rawBuf = await getLineContent(messageId);
            const buf = await processImage(rawBuf);
            const asset = await sanity.assets.upload('image', buf, {
              filename: `stockpile-${bucket.userId.slice(-8)}-${Date.now()}-${i}.jpg`,
              contentType: 'image/jpeg',
            });
            imageRefs.push({
              _type: 'image',
              _key: `img${i}-${asset._id.slice(-6)}`,
              asset: { _type: 'reference', _ref: asset._id },
            });
          } catch (e) {
            console.error('Image upload failed for message', messageId, e);
          }
        }

        await sanity.create({
          _type: 'stockpile',
          memo: bucket.memoParts.join('\n\n'),
          images: imageRefs.length ? imageRefs : undefined,
          receivedAt: new Date().toISOString(),
          source: 'line',
          status: 'new',
          googleMapsUrl: bucket.googleMapsUrl || undefined,
          tabelogUrl: bucket.tabelogUrl || undefined,
          lineUserId: bucket.userId,
        });

        if (bucket.replyToken) {
          const photoCount = imageRefs.length;
          const memoLen = bucket.memoParts.join(' ').length;
          const summary = [
            photoCount ? `📷 写真 ${photoCount} 枚` : null,
            memoLen ? `📝 メモ ${memoLen} 文字` : null,
          ]
            .filter(Boolean)
            .join(' / ');
          await replyToLine(
            bucket.replyToken,
            `📥 ネタ帳に保存しました\n${summary}\n\n/editor のネタ帳タブで確認・記事化できます。`
          );
        }
      } catch (e) {
        console.error('Stockpile create failed:', e);
        if (bucket.replyToken) {
          await replyToLine(
            bucket.replyToken,
            '❌ 保存に失敗しました。少し待ってもう一度送ってください。'
          );
        }
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
