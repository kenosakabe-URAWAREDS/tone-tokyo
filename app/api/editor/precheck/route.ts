import { NextResponse } from 'next/server';
import { createClient } from 'next-sanity';

/**
 * Pre-publish check endpoint.
 *
 * Surfaces the issues that must be resolved before Phase 1 launch.
 * Seven checks run against PUBLISHED article docs (the ones readers
 * actually see). Draft versions already show these issues in the
 * Studio UI via field-level validation, so we keep this endpoint
 * focused on what is currently live on the public site.
 *
 * Checks 6 and 7 require downstream systems (Part 7 disclosure
 * generator and Part 6 AI-noise scorer). Until those ship we return
 * `pending: true` so the UI can render a neutral "—" instead of a
 * misleading zero or a scary "every article fails".
 */

const sanity = createClient({
  projectId: 'w757ks40',
  dataset: 'production',
  apiVersion: '2026-04-17',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
});

type ArticleMeta = {
  _id: string;
  slug: string;
  title: string;
  articleType?: 'editorial' | 'news' | string;
  brandMentionLevel?: number;
  wordCount?: number;
};

type Check = {
  key: string;
  label: string;
  icon: string;
  description: string;
  deadline: string;
  count: number;
  items: ArticleMeta[];
  pending?: boolean;
  pendingReason?: string;
};

type ArticleRow = {
  _id: string;
  slug?: string;
  title?: string;
  articleType?: string;
  body?: unknown;
  answerBlock?: string;
  faqs?: unknown[];
  brandMentions?: string[];
  brandMentionLevel?: number;
  disclosure?: string;
  aiGenerationScore?: { evaluatedAt?: string };
  hasForbiddenMarkers?: boolean;
};

function bodyToText(body: unknown): string {
  if (!body) return '';
  if (typeof body === 'string') return body;
  if (!Array.isArray(body)) return '';
  return body
    .filter(
      (b): b is { _type: string; children: Array<{ text?: unknown }> } =>
        !!b &&
        typeof b === 'object' &&
        (b as { _type?: unknown })._type === 'block' &&
        Array.isArray((b as { children?: unknown }).children)
    )
    .map((b) =>
      b.children
        .map((c) => (c && typeof c.text === 'string' ? c.text : ''))
        .join('')
    )
    .join('\n');
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function meta(a: ArticleRow, extras: Partial<ArticleMeta> = {}): ArticleMeta {
  return {
    _id: a._id,
    slug: a.slug || '',
    title: a.title || '(no title)',
    articleType: a.articleType,
    brandMentionLevel: a.brandMentionLevel,
    ...extras,
  };
}

export async function GET() {
  const projection = `{
    _id,
    "slug": slug.current,
    title,
    articleType,
    body,
    answerBlock,
    faqs,
    brandMentions,
    brandMentionLevel,
    disclosure,
    aiGenerationScore,
    hasForbiddenMarkers
  }`;

  // Default perspective returns published docs only — exactly what
  // we want for the Phase-1 blocker dashboard.
  const articles: ArticleRow[] = await sanity.fetch(
    `*[_type == "article"] | order(coalesce(publishedAt, _updatedAt) desc) ${projection}`
  );

  const checks: Check[] = [
    {
      key: 'forbiddenMarkers',
      label: '禁止マーカー残存',
      icon: '🚨',
      description: '[NEEDS VERIFICATION] などの AI 作業残骸が本文に残っている記事',
      deadline: 'Phase 1 開始前',
      count: 0,
      items: [],
    },
    {
      key: 'lowWordCount',
      label: '語数不足（Editorial）',
      icon: '📏',
      description: 'Editorial 記事で 800 語未満（基準は 800–2000 語）',
      deadline: 'Phase 1 開始前',
      count: 0,
      items: [],
    },
    {
      key: 'missingAnswerBlock',
      label: 'Answer Block 未設定',
      icon: '📝',
      description: 'Editorial 記事の冒頭 30–80 語サマリー（AEO 用）が未入力',
      deadline: 'Phase 1 開始前',
      count: 0,
      items: [],
    },
    {
      key: 'missingFaq',
      label: 'FAQ 未設定',
      icon: '❓',
      description: 'Editorial 記事で最低 1 問の FAQ が無い（FAQPage JSON-LD 用）',
      deadline: 'Phase 1 開始前',
      count: 0,
      items: [],
    },
    {
      key: 'brandMentionMismatch',
      label: 'Brand Mention 整合性',
      icon: '🏷',
      description: 'brandMentions が設定されているのに Level 0（開示レベル未設定）',
      deadline: 'Phase 1 開始前',
      count: 0,
      items: [],
    },
    {
      key: 'missingDisclosure',
      label: 'Disclosure 未生成',
      icon: '📄',
      description: 'brandMentionLevel ≥ 2 で Editor&apos;s Note disclosure が未生成',
      deadline: 'パート7 実装後に実質判定',
      count: 0,
      items: [],
      pending: true,
      pendingReason:
        'Disclosure 自動生成はパート7（記事テンプレート改修）で実装予定。現在は未評価。',
    },
    {
      key: 'missingAiScore',
      label: 'AI臭さスコア未評価',
      icon: '🤖',
      description: 'Editorial 記事で AI 生成スコア（6軸）が未計算',
      deadline: 'パート6 実装後に実質判定',
      count: 0,
      items: [],
      pending: true,
      pendingReason:
        'AI臭さスコアリングはパート6で実装予定。現在は未評価。',
    },
  ];

  const byKey = (k: string) => checks.find((c) => c.key === k)!;

  for (const a of articles) {
    const isEditorial = a.articleType === 'editorial';

    if (a.hasForbiddenMarkers === true) {
      byKey('forbiddenMarkers').items.push(meta(a));
    }

    if (isEditorial) {
      const wc = countWords(bodyToText(a.body));
      if (wc > 0 && wc < 800) {
        byKey('lowWordCount').items.push(meta(a, { wordCount: wc }));
      }
    }

    if (isEditorial && (!a.answerBlock || !a.answerBlock.trim())) {
      byKey('missingAnswerBlock').items.push(meta(a));
    }

    if (isEditorial && (!Array.isArray(a.faqs) || a.faqs.length === 0)) {
      byKey('missingFaq').items.push(meta(a));
    }

    const brandLen = Array.isArray(a.brandMentions) ? a.brandMentions.length : 0;
    if (brandLen > 0 && (!a.brandMentionLevel || a.brandMentionLevel === 0)) {
      byKey('brandMentionMismatch').items.push(meta(a));
    }

    // Below two are counted for reference but surfaced as "pending"
    // in the response — the UI renders "—" until the corresponding
    // implementation part ships.
    if (typeof a.brandMentionLevel === 'number' && a.brandMentionLevel >= 2 && !a.disclosure) {
      byKey('missingDisclosure').items.push(meta(a));
    }
    if (isEditorial && (!a.aiGenerationScore || !a.aiGenerationScore.evaluatedAt)) {
      byKey('missingAiScore').items.push(meta(a));
    }
  }

  for (const c of checks) c.count = c.items.length;

  return NextResponse.json(
    {
      totalPublishedArticles: articles.length,
      generatedAt: new Date().toISOString(),
      checks,
    },
    {
      headers: { 'cache-control': 'no-store' },
    }
  );
}
