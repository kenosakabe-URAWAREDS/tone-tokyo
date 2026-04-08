const fs = require('fs');
let f = fs.readFileSync('app/HomeClient.tsx', 'utf8');

// 1. Add featured variable after useState lines
f = f.replace(
  'const [menuOpen, setMenuOpen] = useState(false);',
  'const [menuOpen, setMenuOpen] = useState(false);\n  const feat = articles && articles.length > 0 ? articles[0] : null;'
);

// 2. Update the <a> tag wrapping Hero to use dynamic slug
f = f.replace(
  'href={"/article/" + FEATURED.slug}',
  'href={"/article/" + (feat?.slug || FEATURED.slug)}'
);

// 3. Update Hero image
f = f.replace(
  'backgroundImage: \url(\)\',
  'backgroundImage: \url(\)\'
);

// 4. Update pillar tag
f = f.replace(
  '<Tag p={FEATURED.pillar} />',
  '<Tag p={feat?.pillar || FEATURED.pillar} />'
);

// 5. Update title
f = f.replace(
  '{FEATURED.title}',
  '{feat?.title || FEATURED.title}'
);

// 6. Update excerpt
f = f.replace(
  '{FEATURED.excerpt}',
  '{feat?.subtitle || FEATURED.excerpt}'
);

// 7. Update date
f = f.replace(
  '{FEATURED.date}',
  '{feat?.publishedAt ? new Date(feat.publishedAt).toLocaleDateString("en-US",{month:"short",day:"numeric"}) : FEATURED.date}'
);

// 8. Update readTime
f = f.replace(
  '{FEATURED.readTime}',
  '{feat?.readTime || FEATURED.readTime}'
);

fs.writeFileSync('app/HomeClient.tsx', f);
console.log('Done');
