import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '..', '.env.local');

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

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'w757ks40',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2026-04-17',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN || process.env.SANITY_WRITE_TOKEN,
});

const okayama = await client.fetch(
  '*[_type == "article" && slug.current == "okayama-selvedge-denim-weavers"][0]{_id, title, readTime, body, bodyJa}'
);
if (!okayama) {
  console.log('not found');
  process.exit(0);
}

const bodyText = (okayama.body || [])
  .filter((b) => b._type === 'block')
  .map((b) => (b.children || []).map((c) => c.text || '').join(''))
  .join('\n\n');

const wordCount = bodyText.trim().split(/\s+/).filter(Boolean).length;
const hasMarker = /\[NEEDS VERIFICATION\]/i.test(bodyText) || /\[NEEDS VERIFICATION\]/i.test(okayama.bodyJa || '');

console.log('ID:', okayama._id);
console.log('Title:', okayama.title);
console.log('readTime:', okayama.readTime);
console.log('wordCount:', wordCount);
console.log('hasNeedsVerificationMarker:', hasMarker);
console.log('\n--- BODY (first 2000 chars) ---');
console.log(bodyText.slice(0, 2000));

if (hasMarker) {
  console.log('\n--- MARKER CONTEXT ---');
  const idx = bodyText.search(/\[NEEDS VERIFICATION\]/i);
  console.log(bodyText.slice(Math.max(0, idx - 150), idx + 200));
}

console.log('\n\n=== ALL ARTICLES: [NEEDS VERIFICATION] SCAN ===');
const all = await client.fetch('*[_type == "article"]{_id, title, "slug": slug.current, body, bodyJa}');
function bodyToText(body) {
  if (!body) return '';
  if (typeof body === 'string') return body;
  if (!Array.isArray(body)) return '';
  return body
    .filter((b) => b && b._type === 'block')
    .map((b) => (b.children || []).map((c) => (c && c.text) || '').join(''))
    .join('\n');
}

let markerCount = 0;
for (const a of all) {
  const bt = bodyToText(a.body);
  const jb = a.bodyJa || '';
  if (/\[NEEDS VERIFICATION\]/i.test(bt) || /\[NEEDS VERIFICATION\]/i.test(jb)) {
    markerCount++;
    console.log(`  - ${a.slug} (${a._id})`);
  }
}
console.log(`\nTotal: ${markerCount} / ${all.length} articles contain [NEEDS VERIFICATION]`);
