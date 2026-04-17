// Part 3 migration: seed the new schema fields on every existing
// article document (both published and draft forms).
//
// Behavior:
//   - articleType          → from ARTICLE_TYPE_MAP (slug-keyed)
//   - brandMentions        → from BRAND_MAP (slug-keyed, default [])
//   - brandMentionLevel    → from BRAND_MAP (slug-keyed, default 0)
//   - hasForbiddenMarkers  → computed from body content
//
// About the old FASHION-specific `articleType` field:
// The migration simply OVERWRITES `articleType` with the new value
// (editorial/news), so any lingering old value such as "Shop Guide"
// on the Blue Store draft disappears by substitution. No explicit
// unset is needed — the same field name now carries the new
// semantic.
//
// Safety:
//   - Default mode is DRY RUN (no writes). Use --apply to commit.
//   - Before writing anything, prints a per-doc change plan so a
//     reviewer can catch unexpected rewrites.
//   - Backup file `backup-before-part3-2026-04-17.ndjson` exists at
//     repo root for rollback (see scripts/backup-dataset.mjs).

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
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[m[1]]) process.env[m[1]] = val;
  }
}
loadEnv(resolve(__dirname, '..', '.env.local'));

const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN;
if (!token) {
  console.error('ERROR: SANITY_WRITE_TOKEN or SANITY_API_TOKEN required in .env.local');
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'w757ks40',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2026-04-17',
  useCdn: false,
  token,
});

const ARTICLE_TYPE_MAP = {
  'gyoryoku-oku-shibu-a-meiji-era-fishmonger-s-teishoku-counter': 'editorial',
  'sushi-onikai-1-proper-edomae-at-a-fair-price': 'news',
  'sushi-w-delivers-proper-omakase-without-the-manhattan-price-tag': 'news',
  'the-price-of-perfection-at-kioi-cho-mitani-bettei': 'editorial',
  'the-rice-makes-the-difference-at-sushi-senpa-in-fukuoka': 'news',
  'okayama-s-hidden-sushi-institution-delivers-edo-style-excellence': 'editorial',
  'the-unchanging-comfort-of-yoshokuya-b-in-ikejiri-ohashi': 'editorial',
  'twenty-years-of-slurping-at-umegaoka-s-katsuya': 'editorial',
  'lynarc-s-hematine-infused-hair-care-creates-salon-results-at-home': 'editorial',
  'the-blue-store-tokyo-s-most-understated-cool': 'editorial',
  'okayama-selvedge-denim-weavers': 'editorial',
};

const BRAND_MAP = {
  'okayama-selvedge-denim-weavers': { brands: ['kuro'], level: 1 },
  'lynarc-s-hematine-infused-hair-care-creates-salon-results-at-home': {
    brands: ['lynarc'],
    level: 3,
  },
  'the-blue-store-tokyo-s-most-understated-cool': {
    brands: ['the_blue_store'],
    level: 3,
  },
};

const FORBIDDEN_PATTERNS = [
  /\[NEEDS VERIFICATION\]/i,
  /\[TODO\]/i,
  /\[PLACEHOLDER\]/i,
  /\[FIXME\]/i,
  /\[TBD\]/i,
];

function bodyToText(body) {
  if (!body) return '';
  if (typeof body === 'string') return body;
  if (!Array.isArray(body)) return '';
  return body
    .filter((b) => b && b._type === 'block' && Array.isArray(b.children))
    .map((b) => b.children.map((c) => (c && typeof c.text === 'string' ? c.text : '')).join(''))
    .join('\n');
}

function detectForbiddenMarkers(body) {
  const text = bodyToText(body);
  return FORBIDDEN_PATTERNS.some((re) => re.test(text));
}

function arraysEqualAsSets(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  for (let i = 0; i < sa.length; i++) if (sa[i] !== sb[i]) return false;
  return true;
}

const apply = process.argv.includes('--apply');

console.log('═══════════════════════════════════════════════════════════════');
console.log('  Part 3 article migration');
console.log('  Mode:', apply ? '⚠  APPLY (writing to Sanity)' : 'DRY RUN (no writes)');
console.log('═══════════════════════════════════════════════════════════════\n');

// perspective:'raw' forces @sanity/client to expose `drafts.*` docs
// alongside published ones. Without it, GROQ queries default to
// the 'published' perspective and Sanity-draft edits Kentaro is
// still working on would silently miss the new schema fields.
const projection =
  '{ _id, _type, title, "slug": slug.current, body, articleType, brandMentions, brandMentionLevel, hasForbiddenMarkers }';
const articles = await client.fetch(
  `*[_type == "article"] | order(_id asc) ${projection}`,
  {},
  { perspective: 'raw' }
);
const drafts = articles.filter((a) => a._id.startsWith('drafts.'));
const published = articles.filter((a) => !a._id.startsWith('drafts.'));

console.log(
  `Fetched ${articles.length} article docs (${published.length} published + ${drafts.length} drafts).\n`
);

const plans = [];
for (const a of articles) {
  const slug = a.slug;
  if (!slug) {
    plans.push({ article: a, error: 'document has no slug — skipping' });
    continue;
  }
  const proposedType = ARTICLE_TYPE_MAP[slug];
  if (!proposedType) {
    plans.push({ article: a, error: `no articleType mapping for slug "${slug}" — skipping` });
    continue;
  }
  const proposedBrands = BRAND_MAP[slug]?.brands || [];
  const proposedLevel = typeof BRAND_MAP[slug]?.level === 'number' ? BRAND_MAP[slug].level : 0;
  const proposedMarkers = detectForbiddenMarkers(a.body);

  const changes = [];

  if (a.articleType !== proposedType) {
    changes.push({ field: 'articleType', before: a.articleType, after: proposedType });
  }

  const currentBrands = Array.isArray(a.brandMentions) ? a.brandMentions : [];
  if (!arraysEqualAsSets(currentBrands, proposedBrands)) {
    changes.push({ field: 'brandMentions', before: currentBrands, after: proposedBrands });
  }

  if (a.brandMentionLevel !== proposedLevel) {
    changes.push({ field: 'brandMentionLevel', before: a.brandMentionLevel, after: proposedLevel });
  }

  if (a.hasForbiddenMarkers !== proposedMarkers) {
    changes.push({
      field: 'hasForbiddenMarkers',
      before: a.hasForbiddenMarkers,
      after: proposedMarkers,
    });
  }

  plans.push({ article: a, changes });
}

// --- Print plan ---
let totalChanges = 0;
let docsWithChanges = 0;
let errors = 0;
for (const p of plans) {
  const a = p.article;
  const kind = a._id.startsWith('drafts.') ? '[DRAFT]' : '       ';
  console.log(`${kind} ${a._id}`);
  console.log(`         slug: ${a.slug || '(none)'}`);
  console.log(`         title: ${(a.title || '').slice(0, 70)}`);
  if (p.error) {
    console.log(`         ⚠  ${p.error}`);
    errors++;
  } else if (p.changes.length === 0) {
    console.log(`         (no changes needed)`);
  } else {
    docsWithChanges++;
    for (const c of p.changes) {
      totalChanges++;
      console.log(
        `         • ${c.field}: ${JSON.stringify(c.before)} → ${JSON.stringify(c.after)}`
      );
    }
  }
  console.log('');
}

console.log('─'.repeat(63));
console.log(`Summary:`);
console.log(`  Documents inspected:     ${plans.length}`);
console.log(`  Documents with changes:  ${docsWithChanges}`);
console.log(`  Total field changes:     ${totalChanges}`);
console.log(`  Errors (skipped docs):   ${errors}`);
console.log('─'.repeat(63));

if (!apply) {
  console.log('\n[DRY RUN] No mutations sent. To apply, re-run with --apply');
  process.exit(0);
}

// --- Apply ---
console.log('\n>>> Applying mutations...\n');
let applied = 0;
for (const p of plans) {
  if (p.error || p.changes.length === 0) continue;
  const setValues = {};
  for (const c of p.changes) setValues[c.field] = c.after;
  try {
    await client.patch(p.article._id).set(setValues).commit();
    applied++;
    const kind = p.article._id.startsWith('drafts.') ? '[DRAFT]' : '       ';
    console.log(
      `  ✓ ${kind} ${p.article._id} — ${p.changes.length} field${p.changes.length === 1 ? '' : 's'} patched`
    );
  } catch (err) {
    console.error(`  ✗ ${p.article._id} FAILED:`, err?.message || err);
  }
}
console.log('\n─'.repeat(63));
console.log(`✅ Migration complete. ${applied} document${applied === 1 ? '' : 's'} patched.`);
