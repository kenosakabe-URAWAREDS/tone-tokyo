# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Stack

Next.js **16.2.2** (App Router) + React **19** + TypeScript + Tailwind **v4**. Content is stored in **Sanity** (project `w757ks40`, dataset `production`); newsletter signups go to **Supabase**; article generation uses the **Anthropic SDK**. Because of the major version bumps (Next 16, React 19, Tailwind 4), defer to `node_modules/next/dist/docs/` over training-data assumptions — see `AGENTS.md`.

Path alias: `@/*` resolves to the repo root (e.g. `@/lib/sanity`).

## Commands

```bash
npm run dev      # next dev
npm run build    # next build
npm run start    # next start (after build)
npm run lint     # eslint (flat config in eslint.config.mjs)
```

There is no test suite configured.

Secrets live in `.env.local` (gitignored): `SANITY_WRITE_TOKEN`, `ANTHROPIC_API_KEY`, `LINE_CHANNEL_SECRET`, `LINE_CHANNEL_ACCESS_TOKEN`, `INPUT_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The Sanity public client (`lib/sanity.ts`) hardcodes `projectId`/`dataset` and uses `useCdn: false`.

## Architecture

### Content model — Sanity `article`

A single `article` document type (`sanity/schemas/index.ts`) drives the entire site. Articles belong to one of five **pillars**: `FASHION`, `EAT`, `CULTURE`, `EXPERIENCE`, `CRAFT`. Each pillar has its own conditional filter fields (`hidden: ({ document }) => document?.pillar !== 'EAT'`, etc.) — when adding pillar-specific fields, follow that same `hidden` pattern so the Studio UI stays clean. Common filters (`area`, `neighborhood`, `editorRating`) apply across pillars.

`heroImage` can be either a Sanity image asset OR a `heroImageUrl` URL — all GROQ queries resolve it via `coalesce(heroImage.asset->url, heroImageUrl)`. Preserve that pattern when writing new queries.

### Routes (App Router, `app/`)

- `/` → `app/page.tsx` fetches articles server-side, hands off to `HomeClient.tsx` (the large client component is the homepage UI).
- `/article/[slug]` → server fetches article + 3 related articles in the same pillar, renders `ArticleClient.tsx`.
- `/discover` → filterable index, accepts `?pillar=FASHION` etc. via `searchParams` (note: `searchParams` is a `Promise` in Next 16 — `await` it, same for `params` in dynamic routes).
- `/input` → in-browser admin form for creating articles (image upload + memo + reference URLs).
- `/studio/[[...index]]` → embedded Sanity Studio via `next-sanity/studio`, configured in `sanity.config.ts`.

### API routes (`app/api/`)

Three POST endpoints, each is a content ingestion pipeline:

1. **`/api/create-article`** — called from `/input`. Accepts memo + base64 images + optional Google Maps / Tabelog / official URLs. Scrapes URL HTML for context, calls Claude (`claude-sonnet-4-20250514`) with the **TONE TOKYO editor system prompt** (first-person Tokyo insider voice; banned words include "amazing", "must-visit", "hidden gem"), uploads images to Sanity as assets, then `sanity.create()`s the article. The system prompt is duplicated in `line-webhook/route.ts` — keep them in sync if you edit one.
2. **`/api/line-webhook`** — LINE bot webhook. Same pipeline but ingests from LINE messages (text or photo), extracts Google Maps / Tabelog URLs from the message text, replies to the user with the published article URL.
3. **`/api/subscribe`** — newsletter signup, inserts into Supabase `newsletter_subscribers` table; treats Postgres unique-violation `23505` as "already subscribed".

Both article-creation routes write to Sanity using `SANITY_WRITE_TOKEN` and currently store the article body as a **single Portable Text block** (`{_type: 'block', children: [{_type: 'span', text: article.body}]}`) — the AI returns body as a plain string, not structured PT. If you need richer formatting, that's the place to change it.

### Client components

`HomeClient.tsx`, `ArticleClient.tsx`, `EatClient.tsx`, and `app/input/page.tsx` are large self-contained client components with inline style objects (`C` for colors, `F` for font families). The design system isn't extracted — each file redeclares its own palette/font constants. When tweaking visuals, edit the constants at the top of the file rather than searching for a shared theme.

## Repo hygiene notes

The repo root and a few `app/` directories contain leftover scratch files from earlier iterations — they are **not** wired into the build:

- Root: `_write.js`, `_sanity.js`, `seed-articles.js`, `write-page.cjs`, `fix*.js` (fix.js through fix12.js), `HomeClient_current.txt`, `ap`.
- `app/HomeClient.tsx.bak`, `app/article/[slug]/ArticleClient (1).tsx`, `app/input/input-page.tsx`.
- `app/api/create-article/create-article-route.ts` and `app/api/line-webhook/line-webhook-route.ts` — only `route.ts` is the active App Router handler; the `*-route.ts` siblings are stale copies.

Don't read or edit these when answering questions about current behavior unless the user explicitly references them.
