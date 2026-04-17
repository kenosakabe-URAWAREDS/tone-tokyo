// One-shot inventory script for Part 1 (現状調査).
// Counts articles and detects title/slug duplicates.
//
// Usage: node scripts/count-articles.mjs > docs/_article_inventory.txt

import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '..', '.env.local');

// Minimal .env.local loader — avoid taking on dotenv as a dep.
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
loadEnv(envPath);

const token = process.env.SANITY_API_TOKEN || process.env.SANITY_WRITE_TOKEN;
if (!token) {
  console.error('ERROR: SANITY_API_TOKEN or SANITY_WRITE_TOKEN required in .env.local');
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'w757ks40',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2026-04-17',
  useCdn: false,
  token,
});

const total = await client.fetch('count(*[_type == "article"])');
const published = await client.fetch(
  'count(*[_type == "article" && !(_id in path("drafts.**")) && (status == "published" || !defined(status))])'
);
const draft = await client.fetch(
  'count(*[_type == "article" && (_id in path("drafts.**") || status == "draft")])'
);
const review = await client.fetch('count(*[_type == "article" && status == "review"])');
const scheduled = await client.fetch('count(*[_type == "article" && status == "scheduled"])');

const all = await client.fetch(
  '*[_type == "article"] | order(_createdAt desc) {_id, title, pillar, status, "slug": slug.current, publishedAt, _createdAt, _updatedAt}'
);

const titleMap = new Map();
const slugMap = new Map();
const duplicatesByTitle = [];
const duplicatesBySlug = [];

for (const a of all) {
  const t = (a.title || '').trim();
  if (t) {
    if (!titleMap.has(t)) titleMap.set(t, []);
    titleMap.get(t).push(a);
  }
  const s = a.slug;
  if (s) {
    if (!slugMap.has(s)) slugMap.set(s, []);
    slugMap.get(s).push(a);
  }
}

for (const [title, rows] of titleMap) {
  if (rows.length > 1) duplicatesByTitle.push({ title, rows });
}
for (const [slug, rows] of slugMap) {
  if (rows.length > 1) duplicatesBySlug.push({ slug, rows });
}

console.log('=== COUNTS ===');
console.log(JSON.stringify({ total, published, draft, review, scheduled }, null, 2));

console.log('\n=== ALL ARTICLES ===');
for (const a of all) {
  const draftMark = a._id.startsWith('drafts.') ? '[DRAFT]' : '       ';
  console.log(
    `${draftMark} ${a._id.padEnd(60)} | ${(a.pillar || '-').padEnd(10)} | status=${(a.status || '-').padEnd(10)} | ${a.slug || '(no slug)'} | ${a.title || '(no title)'}`
  );
}

console.log('\n=== DUPLICATE TITLES ===');
if (duplicatesByTitle.length === 0) {
  console.log('(none)');
} else {
  for (const d of duplicatesByTitle) {
    console.log(`\nTitle: "${d.title}"`);
    for (const r of d.rows) {
      console.log(`  - ${r._id} (slug=${r.slug}, status=${r.status}, created=${r._createdAt})`);
    }
  }
}

console.log('\n=== DUPLICATE SLUGS ===');
if (duplicatesBySlug.length === 0) {
  console.log('(none)');
} else {
  for (const d of duplicatesBySlug) {
    console.log(`\nSlug: ${d.slug}`);
    for (const r of d.rows) {
      console.log(`  - ${r._id} (title="${r.title}", status=${r.status}, created=${r._createdAt})`);
    }
  }
}
