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
 * POST /api/newsletter/generate — Generate weekly newsletter content
 * POST /api/newsletter/send — Send to all subscribers via Resend
 * POST /api/newsletter/test — Send test to a specific email
 * GET  /api/newsletter/latest — Get the most recently generated newsletter
 */

type NewsletterData = {
  personalNote: string;
  topPicks: Array<{ title: string; slug: string; summary: string; pillar: string }>;
  whatIAte?: { title: string; slug: string; summary: string };
  whatImWearing?: { title: string; slug: string; summary: string };
  generatedAt: string;
};

// In-memory cache for the latest generated newsletter
// In production you'd store this in Supabase or Sanity
let latestNewsletter: NewsletterData | null = null;

export async function POST(req: NextRequest) {
  const url = req.nextUrl.pathname;
  const body = await req.json().catch(() => ({}));

  if (url.endsWith('/generate') || body.action === 'generate') {
    return handleGenerate();
  }
  if (url.endsWith('/send') || body.action === 'send') {
    return handleSend(body);
  }
  if (url.endsWith('/test') || body.action === 'test') {
    return handleTest(body);
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

export async function GET() {
  if (!latestNewsletter) {
    return NextResponse.json({ error: 'No newsletter generated yet' }, { status: 404 });
  }
  return NextResponse.json(latestNewsletter);
}

async function handleGenerate() {
  try {
    // Fetch articles from the past 7 days
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const articles = await sanity.fetch(
      `*[_type == "article" && status == "published" && publishedAt >= $since] | order(publishedAt desc) {
        title, slug, subtitle, pillar, publishedAt,
        "bodyExcerpt": body[0..2]
      }`,
      { since: weekAgo }
    );

    if (articles.length === 0) {
      return NextResponse.json({ error: 'No articles published this week' }, { status: 400 });
    }

    const articleSummaries = articles.map((a: any) => ({
      title: a.title,
      slug: a.slug,
      pillar: a.pillar,
      subtitle: a.subtitle,
    }));

    const eatArticle = articles.find((a: any) => a.pillar === 'EAT');
    const fashionArticle = articles.find((a: any) => a.pillar === 'FASHION');

    const prompt = `Generate content for the TONE TOKYO weekly newsletter "This Week in Japan".

Articles published this week:
${JSON.stringify(articleSummaries, null, 2)}

Generate JSON with this structure:
{
  "personalNote": "3-4 sentence editor's note in first person. Warm, insider tone.",
  "topPicks": [up to 3 items, each with "title", "slug", "summary" (1-2 sentences), "pillar"],
  "whatIAte": ${eatArticle ? `{"title": "${eatArticle.title}", "slug": "${eatArticle.slug}", "summary": "1-2 sentences"}` : 'null'},
  "whatImWearing": ${fashionArticle ? `{"title": "${fashionArticle.title}", "slug": "${fashionArticle.slug}", "summary": "1-2 sentences"}` : 'null'}
}

Return ONLY valid JSON.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return NextResponse.json({ error: 'Failed to generate newsletter' }, { status: 500 });
    }

    const data = JSON.parse(match[0]);
    latestNewsletter = { ...data, generatedAt: new Date().toISOString() };

    return NextResponse.json({ ok: true, newsletter: latestNewsletter });
  } catch (error) {
    console.error('newsletter/generate error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

async function handleSend(body: any) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 503 });
  }

  const newsletter = body.newsletter || latestNewsletter;
  if (!newsletter) {
    return NextResponse.json({ error: 'No newsletter to send' }, { status: 400 });
  }

  try {
    // Get all subscribers from Supabase
    const { createClient: createSupabase } = await import('@supabase/supabase-js');
    const supabase = createSupabase(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: subscribers } = await supabase
      .from('newsletter_subscribers')
      .select('email');

    if (!subscribers?.length) {
      return NextResponse.json({ error: 'No subscribers' }, { status: 400 });
    }

    const html = buildNewsletterHtml(newsletter);

    // Send via Resend
    const res = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify(
        subscribers.map((s: any) => ({
          from: 'TONE TOKYO <newsletter@tonetokyo.com>',
          to: s.email,
          subject: 'This Week in Japan — TONE TOKYO',
          html,
        }))
      ),
    });

    const result = await res.json();
    return NextResponse.json({ ok: true, sent: subscribers.length, result });
  } catch (error) {
    console.error('newsletter/send error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

async function handleTest(body: any) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 503 });
  }

  const email = body.email;
  if (!email) {
    return NextResponse.json({ error: 'email required' }, { status: 400 });
  }

  const newsletter = body.newsletter || latestNewsletter;
  if (!newsletter) {
    return NextResponse.json({ error: 'No newsletter to send' }, { status: 400 });
  }

  try {
    const html = buildNewsletterHtml(newsletter);
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: 'TONE TOKYO <newsletter@tonetokyo.com>',
        to: email,
        subject: '[TEST] This Week in Japan — TONE TOKYO',
        html,
      }),
    });
    const result = await res.json();
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error('newsletter/test error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

function buildNewsletterHtml(nl: NewsletterData): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tonetokyo.com';
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:'Georgia',serif;color:#2D2D2D;background:#F8F6F1;margin:0;padding:0}
.container{max-width:600px;margin:0 auto;padding:40px 24px}
h1{font-size:28px;color:#1B3A5C;margin:0 0 8px}
h2{font-size:18px;color:#1B3A5C;margin:32px 0 12px;letter-spacing:0.08em;text-transform:uppercase;font-size:12px;font-family:sans-serif}
p{line-height:1.7;font-size:16px;color:#2D2D2D}
a{color:#1B3A5C;text-decoration:underline}
.pick{padding:16px 0;border-bottom:1px solid #E8E4DB}
.pillar{font-family:sans-serif;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#A39E93}
.footer{font-family:sans-serif;font-size:12px;color:#A39E93;text-align:center;padding:32px 0;border-top:1px solid #E8E4DB;margin-top:32px}
</style></head><body><div class="container">
<h1>This Week in Japan</h1>
<p style="font-family:sans-serif;font-size:12px;color:#A39E93">TONE TOKYO — Weekly Dispatch</p>
<h2>From the Editor</h2>
<p>${nl.personalNote}</p>
<h2>Top Picks</h2>
${nl.topPicks.map(p => `<div class="pick"><span class="pillar">${p.pillar}</span><h3 style="margin:4px 0"><a href="${baseUrl}/article/${p.slug}">${p.title}</a></h3><p style="margin:4px 0;font-size:14px;color:#A39E93">${p.summary}</p></div>`).join('')}
${nl.whatIAte ? `<h2>What I Ate</h2><p><a href="${baseUrl}/article/${nl.whatIAte.slug}">${nl.whatIAte.title}</a> — ${nl.whatIAte.summary}</p>` : ''}
${nl.whatImWearing ? `<h2>What I'm Wearing</h2><p><a href="${baseUrl}/article/${nl.whatImWearing.slug}">${nl.whatImWearing.title}</a> — ${nl.whatImWearing.summary}</p>` : ''}
<div class="footer"><p>TONE TOKYO — Japan, through the eyes of someone who lives it.</p></div>
</div></body></html>`;
}
