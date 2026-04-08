const fs = require('fs');
let f = fs.readFileSync('app/HomeClient.tsx', 'utf8');
f = f.replace(
  'position: "absolute", inset: 0,',
  'position: "absolute", inset: 0, pointerEvents: "none",'
);
fs.writeFileSync('app/HomeClient.tsx', f);
console.log('Done');
