import { client } from '../lib/sanity';
import HomeClient from './HomeClient';

async function getArticles() {
  const query = '*[_type == "article"] | order(publishedAt desc) { _id, title, "slug": slug.current, pillar, subtitle, "heroImage": heroImage.asset->url, tags, readTime, publishedAt }';
  return client.fetch(query);
}

export default async function Home() {
  const articles = await getArticles();
  return <HomeClient articles={articles} />;
}
