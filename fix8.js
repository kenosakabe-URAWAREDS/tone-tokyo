const fs = require('fs');
let f = fs.readFileSync('app/HomeClient.tsx', 'utf8');
f = f.replace("Kentaro's Picks", "The Editor's Selection");
f = f.replace("Kentaro\\u2019s Picks", "The Editor\\u2019s Selection");
fs.writeFileSync('app/HomeClient.tsx', f);
console.log('Done');
