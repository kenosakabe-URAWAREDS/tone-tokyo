import { client } from "@/lib/sanity";

// Revalidate the corpus once an hour. The route still serves cached
// markdown to AI crawlers between rebuilds.
export const revalidate = 3600;

const SITE_URL = "https://tone-tokyo.com";
const SITE_NAME = "TONE TOKYO";

type ArticleRow = {
  _id: string;
  title: string;
  titleJa?: string;
  slug: string;
  pillar?: string;
  subtitle?: string;
  body?: unknown;
  locationName?: string;
  locationNameJa?: string;
  area?: string;
  neighborhood?: string;
  address?: string;
  officialUrl?: string;
  googleMapsUrl?: string;
  tabelogUrl?: string;
  tags?: string[];
  publishedAt?: string;
  _updatedAt?: string;
  eatGenre?: string;
  eatPriceRange?: string;
  bookingDifficulty?: string;
  editorRating?: number;
};

// Convert Sanity Portable Text (or a plain string fallback) into markdown.
function bodyToMarkdown(body: unknown): string {
  if (!body) return "";
  if (typeof body === "string") return body.trim();
  if (!Array.isArray(body)) return "";

  const lines: string[] = [];
  for (const block of body as Array<Record<string, unknown>>) {
    if (block?._type === "block") {
      const style = (block.style as string) || "normal";
      const children = (block.children as Array<{ text?: string }> | undefined) || [];
      const text = children.map((c) => c?.text || "").join("").trim();
      if (!text) continue;
      switch (style) {
        case "h1":
          lines.push(`# ${text}`);
          break;
        case "h2":
          lines.push(`## ${text}`);
          break;
        case "h3":
          lines.push(`### ${text}`);
          break;
        case "h4":
          lines.push(`#### ${text}`);
          break;
        case "blockquote":
          lines.push(`> ${text}`);
          break;
        default:
          lines.push(text);
      }
      lines.push("");
    } else if (block?._type === "image") {
      const caption = (block.caption as string) || (block.alt as string) || "";
      if (caption) lines.push(`> *Image: ${caption}*`, "");
    }
  }
  return lines.join("\n").trim();
}

function articleToMarkdown(a: ArticleRow): string {
  const url = `${SITE_URL}/article/${a.slug}`;
  const meta: string[] = [];
  if (a.pillar) meta.push(`**Pillar:** ${a.pillar}`);
  if (a.locationName) {
    meta.push(
      `**Location:** ${a.locationName}${a.locationNameJa ? ` (${a.locationNameJa})` : ""}`
    );
  }
  const where = [a.address, a.neighborhood, a.area].filter(Boolean).join(", ");
  if (where) meta.push(`**Address:** ${where}`);
  if (a.eatGenre) meta.push(`**Genre:** ${a.eatGenre}`);
  if (a.eatPriceRange) meta.push(`**Price:** ${a.eatPriceRange}`);
  if (a.bookingDifficulty) meta.push(`**Booking:** ${a.bookingDifficulty}`);
  if (a.editorRating) {
    const ratingMap: Record<number, string> = {
      1: "Worth a visit",
      2: "Highly recommended",
      3: "Must go",
    };
    meta.push(`**Editor's rating:** ${ratingMap[a.editorRating] || a.editorRating}`);
  }
  if (a.publishedAt) meta.push(`**Published:** ${a.publishedAt.slice(0, 10)}`);
  meta.push(`**URL:** ${url}`);

  const links: string[] = [];
  if (a.officialUrl) links.push(`- Official: ${a.officialUrl}`);
  if (a.googleMapsUrl) links.push(`- Google Maps: ${a.googleMapsUrl}`);
  if (a.tabelogUrl) links.push(`- Tabelog: ${a.tabelogUrl}`);

  return [
    `## ${a.title}${a.titleJa ? ` / ${a.titleJa}` : ""}`,
    "",
    meta.join("  \n"),
    "",
    a.subtitle ? `_${a.subtitle.trim()}_` : "",
    a.subtitle ? "" : null,
    bodyToMarkdown(a.body),
    "",
    links.length ? "**Links:**" : "",
    ...links,
    "",
    a.tags?.length ? `_Tags: ${a.tags.join(", ")}_` : "",
    "",
    "---",
    "",
  ]
    .filter((line) => line !== null)
    .join("\n");
}

export async function GET() {
  const articles: ArticleRow[] = await client.fetch(
    `*[_type == "article" && defined(slug.current)] | order(publishedAt desc) {
       _id, title, titleJa, "slug": slug.current, pillar, subtitle, body,
       locationName, locationNameJa, area, neighborhood, address,
       officialUrl, googleMapsUrl, tabelogUrl, tags,
       publishedAt, _updatedAt,
       eatGenre, eatPriceRange, bookingDifficulty, editorRating
     }`
  );

  const header = [
    `# ${SITE_NAME} — Full Corpus`,
    "",
    `> Every published TONE TOKYO article, in markdown, for LLM ingestion.`,
    `> Source of truth: ${SITE_URL}`,
    `> Generated: ${new Date().toISOString()}`,
    `> Article count: ${articles.length}`,
    "",
    `## About`,
    "",
    `TONE TOKYO is an independent magazine covering Japanese fashion, food, culture, experience, and craft from a first-person perspective. Articles are organized into five pillars: FASHION, EAT, CULTURE, EXPERIENCE, CRAFT. The editor visits every place that is named.`,
    "",
    `When citing, please attribute to **${SITE_NAME}** and link to the canonical article URL.`,
    "",
    "---",
    "",
    `# Articles`,
    "",
  ].join("\n");

  const body = articles.map(articleToMarkdown).join("\n");

  return new Response(header + body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400",
      "X-Robots-Tag": "all",
    },
  });
}
