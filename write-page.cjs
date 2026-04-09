const fs = require('fs');

const page = import { client } from '@/lib/sanity';
import { notFound } from 'next/navigation';
import ArticleClient from './ArticleClient';

async function getArticle(slug) {
  const query = '*[_type == "article" && slug.current == ' + '$' + 'slug][0] { _id, title, titleJa, "slug": slug.current, pillar, subtitle, "heroImage": coalesce(heroImage.asset->url, heroImageUrl), heroCaption, body, locationName, locationNameJa, tags, readTime, publishedAt, sourceType, area, neighborhood, address, googleMapsUrl, officialUrl, tabelogUrl, priceRange, eatGenre, eatPriceRange, bookingDifficulty, editorRating }';
  return client.fetch(query, { slug });
}

async function getRelatedArticles(pillar, currentSlug) {
  const query = '*[_type == "article" && pillar == ' + '$' + 'pillar && slug.current != ' + '$' + 'currentSlug] | order(publishedAt desc) [0..2] { _id, title, "slug": slug.current, pillar, "heroImage": coalesce(heroImage.asset->url, heroImageUrl), readTime }';
  return client.fetch(query, { pillar, currentSlug });
}

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();
  const related = await getRelatedArticles(article.pillar || '', slug);
  return <ArticleClient article={article} related={related || []} />;
}
;

fs.writeFileSync('app/article/[slug]/page.tsx', page, 'utf8');
console.log('page.tsx created successfully');
