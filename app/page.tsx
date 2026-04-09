export const revalidate = 0;
import { client } from '../lib/sanity';
import HomeClient from './HomeClient';

async function getArticles() {
  // heroImageRef is the raw Sanity image object (asset + crop + hotspot)
  // and feeds @sanity/image-url so we can request a server-side crop at
  // exact pixel dimensions. The coalesced `heroImage` URL string is kept
  // as a fallback for articles that only have a heroImageUrl.
  // Public site only renders published articles. Existing articles
  // predate the status field, so `!defined(status)` keeps them visible.
  const query = `*[_type == "article" && (status == "published" || !defined(status))] | order(publishedAt desc) {
    _id, title, "slug": slug.current, pillar, subtitle,
    "heroImage": coalesce(heroImage.asset->url, heroImageUrl),
    "heroImageRef": heroImage,
    "heroImageHotspot": heroImage.hotspot,
    "heroImageCrop": heroImage.crop,
    tags, readTime, publishedAt
  }`;
  return client.fetch(query);
}

export default async function Home() {
  const articles = await getArticles();
  return <HomeClient articles={articles} />;
}
