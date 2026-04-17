// One-shot preview of what /api/editor/precheck will return.
// Runs the same GROQ query + counting logic against Sanity so we
// can see expected output without spinning up the dev server.

import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadEnv(p) {
  const raw = readFileSync(p, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[m[1]]) process.env[m[1]] = val;
  }
}
loadEnv(resolve(__dirname, '..', '.env.local'));

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'w757ks40',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2026-04-17',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN,
});

function bodyToText(body) {
  if (!body) return '';
  if (typeof body === 'string') return body;
  if (!Array.isArray(body)) return '';
  return body
    .filter((b) => b && b._type === 'block' && Array.isArray(b.children))
    .map((b) => b.children.map((c) => (c && typeof c.text === 'string' ? c.text : '')).join(''))
    .join('\n');
}
function countWords(t) {
  return t.trim().split(/\s+/).filter(Boolean).length;
}

const articles = await client.fetch(`*[_type == "article"] | order(coalesce(publishedAt, _updatedAt) desc) {
  _id, "slug": slug.current, title, articleType, body, answerBlock, faqs, brandMentions, brandMentionLevel, disclosure, aiGenerationScore, hasForbiddenMarkers
}`);

const checks = {
  forbiddenMarkers: [],
  lowWordCount: [],
  missingAnswerBlock: [],
  missingFaq: [],
  brandMentionMismatch: [],
  missingDisclosure: [],
  missingAiScore: [],
};

for (const a of articles) {
  const isE = a.articleType === 'editorial';
  const m = { slug: a.slug, title: a.title };
  if (a.hasForbiddenMarkers === true) checks.forbiddenMarkers.push(m);
  if (isE) {
    const wc = countWords(bodyToText(a.body));
    if (wc > 0 && wc < 800) checks.lowWordCount.push({ ...m, wordCount: wc });
  }
  if (isE && (!a.answerBlock || !a.answerBlock.trim())) checks.missingAnswerBlock.push(m);
  if (isE && (!Array.isArray(a.faqs) || a.faqs.length === 0)) checks.missingFaq.push(m);
  const brandLen = Array.isArray(a.brandMentions) ? a.brandMentions.length : 0;
  if (brandLen > 0 && (!a.brandMentionLevel || a.brandMentionLevel === 0))
    checks.brandMentionMismatch.push(m);
  if (typeof a.brandMentionLevel === 'number' && a.brandMentionLevel >= 2 && !a.disclosure)
    checks.missingDisclosure.push(m);
  if (isE && (!a.aiGenerationScore || !a.aiGenerationScore.evaluatedAt))
    checks.missingAiScore.push(m);
}

console.log('Total published articles scanned:', articles.length);
console.log('');
console.log('=== LIVE CHECKS (Phase 1 blockers) ===');
console.log(`🚨 禁止マーカー残存:      ${checks.forbiddenMarkers.length}`);
for (const x of checks.forbiddenMarkers) console.log(`    - ${x.slug}`);
console.log(`📏 語数不足:              ${checks.lowWordCount.length}`);
for (const x of checks.lowWordCount) console.log(`    - ${x.slug} (${x.wordCount} words)`);
console.log(`📝 Answer Block 未設定:   ${checks.missingAnswerBlock.length}`);
for (const x of checks.missingAnswerBlock) console.log(`    - ${x.slug}`);
console.log(`❓ FAQ 未設定:            ${checks.missingFaq.length}`);
for (const x of checks.missingFaq) console.log(`    - ${x.slug}`);
console.log(`🏷 Brand Mention 整合性:  ${checks.brandMentionMismatch.length}`);
for (const x of checks.brandMentionMismatch) console.log(`    - ${x.slug}`);
console.log('');
console.log('=== PENDING (UI shows "—") ===');
console.log(`📄 Disclosure 未生成:      ${checks.missingDisclosure.length} (reference only)`);
for (const x of checks.missingDisclosure) console.log(`    - ${x.slug}`);
console.log(`🤖 AI臭さスコア未評価:     ${checks.missingAiScore.length} (reference only)`);
for (const x of checks.missingAiScore) console.log(`    - ${x.slug}`);
