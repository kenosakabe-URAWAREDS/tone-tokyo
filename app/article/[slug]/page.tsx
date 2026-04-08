import { client } from "@/lib/sanity";
import { notFound } from "next/navigation";
import ArticleClient from "./ArticleClient";

async function getArticle(slug: string) {
  const query = `*[_type == "article" && slug.current == $slug][0] {
    _id, title, titleJa, "slug": slug.current, pillar, subtitle,
    "heroImage": heroImage.asset->url, heroImageUrl, heroCaption,
    body, locationName, locationNameJa,
    tags, readTime, publishedAt, sourceType, googleMapsUrl, tabelogUrl, address, priceRange
  }`;
  return client.fetch(query, { slug });
}

async function getRelatedArticles(pillar: string, currentSlug: string) {
  const query = `*[_type == "article" && pillar == $pillar && slug.current != $currentSlug] | order(publishedAt desc) [0..2] {
    _id, title, "slug": slug.current, pillar, "heroImage": heroImage.asset->url, heroImageUrl, readTime
  }`;
  return client.fetch(query, { pillar, currentSlug });
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const related = await getRelatedArticles(article.pillar || "", slug);

  return <ArticleClient article={article} related={related || []} />;
}
