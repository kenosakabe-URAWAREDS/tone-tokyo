// Generate a path-annotated diff list for the 8 B-class
// [NEEDS VERIFICATION] markers. Pure read-only; no writes to Sanity.
//
// Output:
//   - docs/_needs_verification_diff.md  (human-readable, for review)
//   - stdout (mirrored so the user can see it in the terminal)
//
// The list of PATCHES below is the source of truth for the eventual
// remove-needs-verification.mjs apply script — keep them identical.

import { createClient } from '@sanity/client';
import { readFileSync, writeFileSync } from 'node:fs';
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
  token: process.env.SANITY_API_TOKEN || process.env.SANITY_WRITE_TOKEN,
});

// Each patch is a substring removal within a single span.text. The
// leading space is intentional — removing " [NEEDS VERIFICATION]: ..."
// (with the space) avoids leaving a double space where punctuation is
// already present on the preceding word.
const PATCHES = [
  {
    n: 1,
    slug: 'okayama-selvedge-denim-weavers',
    find: ' [NEEDS VERIFICATION]: exact age of youngest weaver',
    replace: '',
  },
  {
    n: 2,
    slug: 'okayama-s-hidden-sushi-institution-delivers-edo-style-excellence',
    find: ' [NEEDS VERIFICATION]: founding year / 30-year claim',
    replace: '',
  },
  {
    n: 3,
    slug: 'okayama-s-hidden-sushi-institution-delivers-edo-style-excellence',
    find: ' [NEEDS VERIFICATION]: nearest station, exact omakase price, days closed',
    replace: '',
  },
  {
    n: 4,
    slug: 'the-rice-makes-the-difference-at-sushi-senpa-in-fukuoka',
    find: ' [NEEDS VERIFICATION]: market source — Tsukiji vs Toyosu vs Fukuoka local',
    replace: '',
  },
  {
    n: 5,
    slug: 'the-rice-makes-the-difference-at-sushi-senpa-in-fukuoka',
    find: ' [NEEDS VERIFICATION]: omakase price and counter seat count',
    replace: '',
  },
  {
    n: 6,
    slug: 'the-unchanging-comfort-of-yoshokuya-b-in-ikejiri-ohashi',
    find: ' [NEEDS VERIFICATION]: walking distance, opening days/hours, exact average spend',
    replace: '',
  },
  {
    n: 7,
    slug: 'twenty-years-of-slurping-at-umegaoka-s-katsuya',
    find: ' [NEEDS VERIFICATION]: opening days, opening hours, exact bowl price',
    replace: '',
  },
  {
    n: 8,
    slug: 'the-blue-store-tokyo-s-most-understated-cool',
    find: ' [NEEDS VERIFICATION]: street address, opening hours, days closed',
    replace: '',
  },
];

// Cache one fetch per article. Same slug can appear twice.
const articleCache = new Map();
async function getArticle(slug) {
  if (articleCache.has(slug)) return articleCache.get(slug);
  const a = await client.fetch(
    '*[_type == "article" && slug.current == $slug][0]{_id, title, body, "slug": slug.current}',
    { slug }
  );
  articleCache.set(slug, a);
  return a;
}

// Walk body[].children[] and find the first occurrence of `find` in a span.
function findSpan(body, find) {
  if (!Array.isArray(body)) return null;
  for (let bi = 0; bi < body.length; bi++) {
    const block = body[bi];
    if (!block || block._type !== 'block' || !Array.isArray(block.children)) continue;
    for (let ci = 0; ci < block.children.length; ci++) {
      const child = block.children[ci];
      if (!child || typeof child.text !== 'string') continue;
      const at = child.text.indexOf(find);
      if (at !== -1) {
        return {
          blockIdx: bi,
          childIdx: ci,
          blockKey: block._key,
          spanKey: child._key,
          spanText: child.text,
          offsetInSpan: at,
        };
      }
    }
  }
  return null;
}

const results = [];
for (const patch of PATCHES) {
  const a = await getArticle(patch.slug);
  if (!a) {
    results.push({ ...patch, error: 'article not found in Sanity' });
    continue;
  }
  // For slugs with two markers, we need to find the Nth occurrence of
  // that slug's find-string so we don't collide. Each patch uses a
  // distinct `find` substring, so indexOf semantics are already safe —
  // we just apply patches in order and refetch so later patches see
  // the result of earlier ones. But since this is a dry-run (no
  // writes), we operate on the original body each time: the only risk
  // is if two patches share the same slug AND the same `find`, which
  // they don't.
  const hit = findSpan(a.body, patch.find);
  if (!hit) {
    results.push({
      ...patch,
      articleId: a._id,
      articleTitle: a.title,
      error: `find-string not located in any span of article body`,
    });
    continue;
  }
  // Replace the first occurrence in that span only.
  const after = hit.spanText.replace(patch.find, patch.replace);
  results.push({
    ...patch,
    articleId: a._id,
    articleTitle: a.title,
    blockIdx: hit.blockIdx,
    childIdx: hit.childIdx,
    blockKey: hit.blockKey,
    spanKey: hit.spanKey,
    before: hit.spanText,
    after,
    charOffsetInSpan: hit.offsetInSpan,
    stillContainsMarker: /\[NEEDS VERIFICATION\]/i.test(after),
  });
}

// ---- Render markdown ----
const lines = [];
lines.push('# B分類 8箇所 差分リスト');
lines.push('');
lines.push(`生成日: ${new Date().toISOString().slice(0, 10)}`);
lines.push('スクリプト: scripts/generate-b-diff.mjs');
lines.push('');
lines.push('各項目は Sanity Portable Text の body 内 span 単位。');
lines.push('path: `body[blockIdx].children[childIdx].text` （Portable Text の span.text フィールド）');
lines.push('');
lines.push('━━━━━━━━━━━━━━━━━━━━');
lines.push('');

for (const r of results) {
  lines.push(`## [${r.n}/8]`);
  lines.push('');
  lines.push(`- **slug:** \`${r.slug}\``);
  if (r.error) {
    lines.push(`- **ERROR:** ${r.error}`);
    lines.push('');
    lines.push('---');
    lines.push('');
    continue;
  }
  lines.push(`- **article _id:** \`${r.articleId}\``);
  lines.push(`- **title:** ${r.articleTitle}`);
  lines.push(`- **path:** \`body[${r.blockIdx}].children[${r.childIdx}].text\``);
  lines.push(`- **block _key:** \`${r.blockKey}\``);
  lines.push(`- **span _key:** \`${r.spanKey}\``);
  lines.push(`- **find substring:** \`${JSON.stringify(r.find)}\``);
  lines.push(`- **char offset in span:** ${r.charOffsetInSpan}`);
  lines.push(`- **residual marker after patch?** ${r.stillContainsMarker ? '⚠️ YES' : '✅ no'}`);
  lines.push('');
  lines.push('**before:**');
  lines.push('');
  lines.push('```');
  lines.push(r.before);
  lines.push('```');
  lines.push('');
  lines.push('**after:**');
  lines.push('');
  lines.push('```');
  lines.push(r.after);
  lines.push('```');
  lines.push('');
  lines.push('---');
  lines.push('');
}

// Summary
const errors = results.filter((r) => r.error);
const residuals = results.filter((r) => r.stillContainsMarker);
lines.push('## サマリー');
lines.push('');
lines.push(`- 処理対象: ${results.length} 件`);
lines.push(`- エラー（該当箇所未検出）: ${errors.length} 件`);
lines.push(`- パッチ後に \`[NEEDS VERIFICATION]\` が残存するもの: ${residuals.length} 件`);
if (errors.length || residuals.length) {
  lines.push('');
  lines.push('⚠️ エラーまたは残存がある場合、apply前に PATCHES を調整する必要があります。');
}

const out = lines.join('\n');
const diffPath = resolve(__dirname, '..', 'docs', '_needs_verification_diff.md');
writeFileSync(diffPath, out);

console.log(out);
console.log('\n\n');
console.log(`✅ Saved: ${diffPath}`);
