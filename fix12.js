const fs = require("fs");
let f = fs.readFileSync("app/HomeClient.tsx", "utf8");

f = f.replace(
  'const [menuOpen, setMenuOpen] = useState(false);',
  'const [menuOpen, setMenuOpen] = useState(false);\n  const feat = articles && articles.length > 0 ? articles[0] : null;'
);

f = f.replace(
  'href={"/article/" + FEATURED.slug}',
  'href={"/article/" + (feat?.slug || FEATURED.slug)}'
);

f = f.replace(
  "backgroundImage: `url(${FEATURED.image})`",
  "backgroundImage: `url(${feat?.heroImage || FEATURED.image})`"
);

f = f.replace(
  '<Tag p={FEATURED.pillar} />',
  '<Tag p={feat?.pillar || FEATURED.pillar} />'
);

f = f.replace(
  '{FEATURED.title}',
  '{feat?.title || FEATURED.title}'
);

f = f.replace(
  '{FEATURED.excerpt}',
  '{feat?.subtitle || FEATURED.excerpt}'
);

f = f.replace(
  '{FEATURED.date}',
  '{feat?.publishedAt ? new Date(feat.publishedAt).toLocaleDateString("en-US",{month:"short",day:"numeric"}) : FEATURED.date}'
);

f = f.replace(
  '{FEATURED.readTime}',
  '{feat?.readTime || FEATURED.readTime}'
);

fs.writeFileSync("app/HomeClient.tsx", f);
console.log("Done");
