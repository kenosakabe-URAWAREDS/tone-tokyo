import { createClient } from 'next-sanity';

export const client = createClient({
  projectId: 'w757ks40',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
});

export async function getArticles() {
  const query = '*[_type == "article"] | order(publishedAt desc) { _id, title, "slug": slug.current, pillar, subtitle, "heroImage": heroImage.asset->url, heroCaption, tags, readTime, publishedAt, sourceType }';
  return client.fetch(query);
}

export async function getArticleBySlug(slug: string) {
  const query = '*[_type == "article" && slug.current == ][0] { _id, title, "slug": slug.current, pillar, subtitle, "heroImage": heroImage.asset->url, heroCaption, body, locationName, locationNameJa, tags, readTime, publishedAt, sourceType }';
  return client.fetch(query, { slug });
}
