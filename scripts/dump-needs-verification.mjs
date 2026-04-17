// Dump every [NEEDS VERIFICATION] marker with surrounding context so
// Claude can propose A/B/C per marker and kentaro can judge.

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
  token: process.env.SANITY_API_TOKEN || process.env.SANITY_WRITE_TOKEN,
});

function bodyToText(body) {
  if (!body) return '';
  if (typeof body === 'string') return body;
  if (!Array.isArray(body)) return '';
  return body
    .filter((b) => b && b._type === 'block')
    .map((b) => (b.children || []).map((c) => (c && c.text) || '').join(''))
    .join('\n\n');
}

const all = await client.fetch(
  '*[_type == "article"] | order(pillar asc, slug.current asc) {_id, title, pillar, "slug": slug.current, body, bodyJa}'
);

const MARKER_RE = /\[NEEDS VERIFICATION\][^\n]*/gi;

for (const a of all) {
  const bt = bodyToText(a.body);
  const matches = [...bt.matchAll(MARKER_RE)];
  if (matches.length === 0) continue;

  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`SLUG: ${a.slug}`);
  console.log(`PILLAR: ${a.pillar}`);
  console.log(`TITLE: ${a.title}`);
  console.log(`_ID: ${a._id}`);
  console.log(`MARKER COUNT: ${matches.length}`);
  console.log('───────────────────────────────────────────────────────────────');

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const idx = m.index ?? 0;
    const before = bt.slice(Math.max(0, idx - 300), idx);
    const marker = m[0];
    const after = bt.slice(idx + marker.length, idx + marker.length + 300);

    console.log(`\n  [marker ${i + 1}/${matches.length}] at char ${idx}`);
    console.log('  --- BEFORE ---');
    console.log('  ' + before.replace(/\n/g, '\n  '));
    console.log('  --- MARKER ---');
    console.log('  >>> ' + marker);
    console.log('  --- AFTER ---');
    console.log('  ' + after.replace(/\n/g, '\n  '));
  }
  console.log('');
}
