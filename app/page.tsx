export const revalidate = 0;
import { client } from '../lib/sanity';
import HomeClient from './HomeClient';

async function getArticles() {
  const query = '*[_type == "article"] | order(publishedAt desc) { _id, title, "slug": slug.current, pillar, subtitle, "heroImage": coalesce(heroImage.asset->url, heroImageUrl), tags, readTime, publishedAt }';
  return client.fetch(query);
}

export default async function Home() {
  const articles = await getArticles();
  return <HomeClient articles={articles} />;
}
