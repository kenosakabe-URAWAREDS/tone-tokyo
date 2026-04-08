const fs = require('fs');
let f = fs.readFileSync('app/HomeClient.tsx', 'utf8');

// 1. Update HomeClient to accept featured from articles
// Change the Hero component to accept article data
f = f.replace(
  'export default function HomeClient({ articles }: { articles?: any[] }) {',
  'export default function HomeClient({ articles }: { articles?: any[] }) {\n  const featured = articles && articles.length > 0 ? articles[0] : null;'
);

// 2. Update Hero call to pass featured data
f = f.replace(
  '<Hero vis={heroVis} />',
  '<Hero vis={heroVis} article={featured} />'
);

// 3. Update Hero function signature and use dynamic data
f = f.replace(
  'function Hero({ vis }: { vis: boolean }) {',
  'function Hero({ vis, article }: { vis: boolean; article: any }) {'
);

// 4. Replace FEATURED references in Hero with article data
f = f.replace(
  'href={"/article/" + FEATURED.slug}',
  'href={"/article/" + (article?.slug || FEATURED.slug)}'
);
f = f.replace(
  'backgroundImage: \url(\)\',
  'backgroundImage: \url(\)\'
);
f = f.replace(
  '<Tag p={FEATURED.pillar} />',
  '<Tag p={article?.pillar || FEATURED.pillar} />'
);
f = f.replace(
  '{FEATURED.title}',
  '{article?.title || FEATURED.title}'
);
f = f.replace(
  '{FEATURED.excerpt}',
  '{article?.subtitle || article?.excerpt || FEATURED.excerpt}'
);
f = f.replace(
  '{FEATURED.date}',
  '{article?.publishedAt ? new Date(article.publishedAt).toLocaleDateString("en-US", {month:"short",day:"numeric"}) : FEATURED.date}'
);
f = f.replace(
  '{FEATURED.readTime}',
  '{article?.readTime || FEATURED.readTime}'
);

fs.writeFileSync('app/HomeClient.tsx', f);
console.log('Done');
