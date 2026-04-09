import type { MetadataRoute } from 'next';
import { client } from '@/lib/sanity';

export const revalidate = 3600;

const SITE = 'https://tone-tokyo.com';
const PILLARS = ['FASHION', 'EAT', 'CULTURE', 'EXPERIENCE', 'CRAFT'] as const;

type ArticleRow = { slug: string; publishedAt?: string; _updatedAt?: string };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles: ArticleRow[] = await client.fetch(
    // status filter: published only; existing articles without the
    // field are still treated as published.
    `*[_type == "article" && defined(slug.current) && (status == "published" || !defined(status))]{
       "slug": slug.current,
       publishedAt,
       _updatedAt
     }`
  );

  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${SITE}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE}/discover`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...PILLARS.map((p) => ({
      url: `${SITE}/discover?pillar=${p}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
  ];

  const articleEntries: MetadataRoute.Sitemap = articles
    .filter((a) => !!a.slug)
    .map((a) => ({
      url: `${SITE}/article/${a.slug}`,
      lastModified: a._updatedAt || a.publishedAt || now,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

  return [...staticEntries, ...articleEntries];
}
