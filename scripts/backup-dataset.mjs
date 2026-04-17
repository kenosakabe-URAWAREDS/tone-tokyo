// Full-dataset backup via Sanity's Export API.
//
// Rationale: `npx sanity dataset export` requires sanity.cli.ts which
// this repo doesn't ship, and adding it just for one backup creates
// schema-residency ambiguity. Hitting the Export endpoint directly
// with the existing SANITY_API_TOKEN is the smallest, most portable
// path — and produces the same NDJSON format that
// `sanity dataset import` accepts, so rollback stays possible.
//
// Note: this backup contains all document payloads (including asset
// references), but NOT the asset binary files themselves — those
// live on Sanity's CDN independently and survive document deletion.
// A document-level rollback is fully viable from this file.
//
// Usage:
//   node scripts/backup-dataset.mjs

import { readFileSync, writeFileSync, statSync } from 'node:fs';
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

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'w757ks40';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const token = process.env.SANITY_API_TOKEN || process.env.SANITY_WRITE_TOKEN;
if (!token) {
  console.error('ERROR: SANITY_API_TOKEN required in .env.local');
  process.exit(1);
}

const apiVersion = '2026-04-17';
const exportUrl = `https://${projectId}.api.sanity.io/v${apiVersion}/data/export/${dataset}`;

console.log(`Calling Export API: ${exportUrl}`);
const res = await fetch(exportUrl, {
  headers: { Authorization: `Bearer ${token}` },
});

if (!res.ok) {
  const body = await res.text();
  console.error(`Export failed (HTTP ${res.status}):\n${body}`);
  process.exit(1);
}

const buf = Buffer.from(await res.arrayBuffer());
const outPath = resolve(__dirname, '..', 'backup-before-part3-2026-04-17.ndjson');
writeFileSync(outPath, buf);

const size = statSync(outPath).size;
const lines = buf
  .toString('utf8')
  .split('\n')
  .filter((l) => l.trim());

const countsByType = new Map();
let assetRefs = 0;
for (const line of lines) {
  try {
    const doc = JSON.parse(line);
    const t = doc._type || '(unknown)';
    countsByType.set(t, (countsByType.get(t) || 0) + 1);
    const s = JSON.stringify(doc);
    assetRefs += (s.match(/"_ref":"image-/g) || []).length;
    assetRefs += (s.match(/"_ref":"file-/g) || []).length;
  } catch (e) {
    console.error('Parse error on line:', line.slice(0, 80));
  }
}

console.log('\n─────────────────────────────────────────');
console.log('✅ Backup complete');
console.log('─────────────────────────────────────────');
console.log(`File:           ${outPath}`);
console.log(`Size:           ${size.toLocaleString()} bytes (${(size / 1024).toFixed(1)} KB)`);
console.log(`Total docs:     ${lines.length}`);
console.log('Docs by type:');
for (const [t, n] of [...countsByType.entries()].sort()) {
  console.log(`  - ${t.padEnd(20)}: ${n}`);
}
console.log(`Asset refs:     ${assetRefs} (asset binaries remain on Sanity CDN and are not included)`);
console.log('\nRestore command (if needed):');
console.log(`  npx sanity@latest dataset import ${outPath} ${dataset} --replace`);
