const fs = require('fs');
let f = fs.readFileSync('app/HomeClient.tsx', 'utf8');
// Wrap <Hero /> call with an <a> tag
f = f.replace(
  '<Hero vis={heroVis} />',
  '<a href={"/article/" + FEATURED.slug} style={{ textDecoration: "none", display: "block", color: "inherit" }}><Hero vis={heroVis} /></a>'
);
fs.writeFileSync('app/HomeClient.tsx', f);
console.log('Done');
