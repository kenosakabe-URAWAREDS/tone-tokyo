import { client } from "@/lib/sanity";
import EatClient from "./EatClient";

// Public site only renders published articles. Existing articles
// predate the status field, so `!defined(status)` keeps them visible.
// Public site only renders published articles. Existing articles
// predate the status field, so `!defined(status)` keeps them visible.
const query = '*[_type == "article" && (status == "published" || !defined(status))] | order(publishedAt desc) { _id, title, "slug": slug.current, pillar, subtitle, "heroImage": coalesce(heroImage.asset->url, heroImageUrl), tags, readTime, publishedAt, area, neighborhood, editorRating, eatGenre, bookingDifficulty, drinks, scene, eatPriceRange, fashionCategory, fashionPriceRange, cultureCategory, experienceCategory, craftCategory, isJapaneseAbroad, city, country }';

export const revalidate = 60;

export default async function EatPage({ searchParams }: { searchParams: Promise<{ pillar?: string }> }) {
  const params = await searchParams;
  const articles = await client.fetch(query);
  return <EatClient articles={articles} initialPillar={params.pillar || "All"} />;
}
