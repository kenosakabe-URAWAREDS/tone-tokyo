const {createClient} = require('next-sanity');
const c = createClient({
  projectId: 'w757ks40',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false
});
const query = '*[_type == "article"] | order(publishedAt desc) { _id, title, "slug": slug.current, pillar, subtitle, "heroImage": coalesce(heroImage.asset->url, heroImageUrl), heroCaption, tags, readTime, publishedAt, sourceType }';
c.fetch(query).then(a => {
  a.forEach(x => console.log(x.title + ' => ' + (x.heroImage || 'NULL')));
});