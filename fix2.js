const fs = require('fs');
let f = fs.readFileSync('app/HomeClient.tsx', 'utf8');
// Fix: background image div - try with \n (LF)
f = f.replace(
  'position: "absolute", inset: 0,\n            backgroundImage:',
  'position: "absolute", inset: 0, pointerEvents: "none",\n            backgroundImage:'
);
// Also try with \r\n (CRLF)
f = f.replace(
  'position: "absolute", inset: 0,\r\n            backgroundImage:',
  'position: "absolute", inset: 0, pointerEvents: "none",\r\n            backgroundImage:'
);
fs.writeFileSync('app/HomeClient.tsx', f);
console.log('Done');
