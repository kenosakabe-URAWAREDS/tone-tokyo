const {createClient} = require('next-sanity');
const c = createClient({
  projectId: 'w757ks40',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false
});
c.fetch('*[_type == "article"][0..2]{title, readTime, slug}').then(a => {
  a.forEach(x => console.log(JSON.stringify(x)));
});