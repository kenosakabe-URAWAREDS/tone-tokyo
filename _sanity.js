const {createClient} = require('next-sanity');
const c = createClient({
  projectId: 'w757ks40',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false
});
c.fetch('*[_type == "article"][0..2]{"heroImage": coalesce(heroImage.asset->url, heroImageUrl), title}').then(a => {
  a.forEach(x => console.log(x.title + ' => ' + x.heroImage));
});