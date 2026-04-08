const fs = require('fs');
let f = fs.readFileSync('app/HomeClient.tsx', 'utf8');
f = f.replace(
  'pillar: "CRAFT",',
  'pillar: "CRAFT", slug: "okayama-selvedge-denim-weavers",'
);
fs.writeFileSync('app/HomeClient.tsx', f);
console.log('Done');
