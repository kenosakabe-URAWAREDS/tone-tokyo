import { client } from "@/lib/sanity";
import EatClient from "./EatClient";

const query = '*[_type == "article"] | order(publishedAt desc) { _id, title, "slug": slug.current, pillar, subtitle, "heroImage": coalesce(heroImage.asset->url, heroImageUrl), tags, readTime, publishedAt, area, neighborhood, editorRating, eatGenre, bookingDifficulty, drinks, scene, eatPriceRange, fashionCategory, fashionPriceRange, cultureCategory, experienceCategory, craftCategory }';

export const revalidate = 60;

export default async function EatPage({ searchParams }: { searchParams: Promise<{ pillar?: string }> }) {
  const params = await searchParams;
  const articles = await client.fetch(query);
  return <EatClient articles={articles} initialPillar={params.pillar || "All"} />;
}
