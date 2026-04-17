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

const a = await client.fetch(
  '*[_type == "article" && slug.current == "lynarc-s-hematine-infused-hair-care-creates-salon-results-at-home"][0]{title, body}'
);

function bodyToText(body) {
  if (!body) return '';
  if (typeof body === 'string') return body;
  if (!Array.isArray(body)) return '';
  return body
    .filter((b) => b && b._type === 'block')
    .map((b) => (b.children || []).map((c) => (c && c.text) || '').join(''))
    .join('\n\n');
}

console.log('TITLE:', a.title);
console.log('\n--- FULL BODY ---\n');
console.log(bodyToText(a.body));
