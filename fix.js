const fs = require('fs');
let f = fs.readFileSync('app/HomeClient.tsx', 'utf8');
// Fix 1: background image div
f = f.replace(
  'position: "absolute", inset: 0,\r\n            backgroundImage:',
  'position: "absolute", inset: 0, pointerEvents: "none",\r\n            backgroundImage:'
);
// Fix 2: gradient overlay div  
f = f.replace(
  'background: "linear-gradient(transparent, rgba(0,0,0,0.7))" }}',
  'background: "linear-gradient(transparent, rgba(0,0,0,0.7))", pointerEvents: "none" }}'
);
fs.writeFileSync('app/HomeClient.tsx', f);
console.log('Done');
