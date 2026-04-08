const fs = require('fs');
let f = fs.readFileSync('app/HomeClient.tsx', 'utf8');
f = f.replace('Kentaro{\"\\u2019\"}s Picks', 'The Editor{\"\\u2019\"}s Selection');
fs.writeFileSync('app/HomeClient.tsx', f);
console.log('Done');
